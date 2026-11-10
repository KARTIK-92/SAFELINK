import uuid
from datetime import datetime, timezone
from typing import List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_woman
from app.models.user import User
from app.models.incident import (
    EmergencyIncident, IncidentStatus, VolunteerIncidentStatus,
    IncidentVolunteer, IncidentLocationUpdate, NotificationLog
)
from app.schemas.incident import (
    SOSStartRequest, SOSStartResponse, SOSLocationUpdateRequest,
    SOSCancelRequest, SOSStatusResponse, ResponderPublicInfo
)
from app.services.emergency_service import emergency_engine

router = APIRouter(prefix="/sos", tags=["Emergency SOS Engine"])


@router.post("/start", response_model=SOSStartResponse, status_code=status.HTTP_201_CREATED)
async def start_emergency(
    payload: SOSStartRequest,
    current_user: User = Depends(get_current_woman),
    db: AsyncSession = Depends(get_db)
):
    """Initiate an atomic emergency incident:
    - Generates 256-bit unguessable tracking link.
    - Notifies registered emergency contacts (SMS, WhatsApp, Email).
    - Queries PostGIS/Spatial index for verified nearby volunteers.
    - Dispatches privacy-preserving push notifications.
    """
    # 1. Concurrency check: Prevent duplicate simultaneous active emergencies for the same user
    active_existing = await emergency_engine.get_active_incident_for_woman(current_user.id, db)
    if active_existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "An emergency incident is already active for this account.",
                "active_incident_id": str(active_existing.id),
                "started_at": active_existing.started_at.isoformat()
            }
        )

    # 2. Trigger atomic SOS workflow
    incident, raw_token, contacts_count, volunteers_count = await emergency_engine.start_emergency(
        woman=current_user,
        latitude=payload.latitude,
        longitude=payload.longitude,
        accuracy_meters=payload.accuracy_meters,
        address_hint=payload.address_hint,
        db=db
    )

    return SOSStartResponse(
        incident_id=str(incident.id),
        status=incident.status,
        started_at=incident.started_at,
        tracking_token=raw_token,
        tracking_url=f"{settings.EMERGENCY_TRACKING_BASE_URL}/{raw_token}",
        contacts_notified_count=contacts_count,
        volunteers_notified_count=volunteers_count,
        expires_at=incident.expires_at
    )


@router.post("/location")
async def update_live_location(
    payload: SOSLocationUpdateRequest,
    current_user: User = Depends(get_current_woman),
    db: AsyncSession = Depends(get_db)
):
    """Stream continuous GPS breadcrumbs during active SOS.
    Strictly rejected if emergency is not active or belongs to another user.
    """
    res = await db.execute(
        select(EmergencyIncident).where(
            and_(
                EmergencyIncident.id == payload.incident_id,
                EmergencyIncident.woman_id == current_user.id
            )
        )
    )
    incident = res.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found.")

    if incident.status != IncidentStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incident is not active; location stream rejected."
        )

    crumb = IncidentLocationUpdate(
        incident_id=incident.id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        accuracy_meters=payload.accuracy_meters,
        battery_level=payload.battery_level,
        recorded_at=datetime.now(timezone.utc)
    )
    db.add(crumb)
    await db.commit()

    return {"status": "recorded", "recorded_at": crumb.recorded_at}


@router.post("/cancel")
async def cancel_emergency(
    payload: SOSCancelRequest,
    current_user: User = Depends(get_current_woman),
    db: AsyncSession = Depends(get_db)
):
    """Safely terminate emergency incident:
    - Revokes all shared live-tracking tokens immediately.
    - Halts further location updates.
    - Notifies family contacts and assigned volunteers of safety.
    """
    res = await db.execute(
        select(EmergencyIncident).where(
            and_(
                EmergencyIncident.id == payload.incident_id,
                EmergencyIncident.woman_id == current_user.id
            )
        )
    )
    incident = res.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found.")

    if incident.status != IncidentStatus.ACTIVE:
        return {
            "status": "already_inactive",
            "incident_id": str(incident.id),
            "current_status": incident.status.value
        }

    cancelled_inc = await emergency_engine.cancel_emergency(
        incident=incident,
        reason=payload.reason or "Cancelled by user",
        user_id=current_user.id,
        db=db
    )

    return {
        "status": "cancelled",
        "incident_id": str(cancelled_inc.id),
        "cancelled_at": cancelled_inc.cancelled_at
    }


@router.get("/active")
async def get_active_emergency(
    current_user: User = Depends(get_current_woman),
    db: AsyncSession = Depends(get_db)
):
    """Check if current woman account has an active emergency session."""
    active_inc = await emergency_engine.get_active_incident_for_woman(current_user.id, db)
    if not active_inc:
        return {"active": False}

    # Fetch latest location
    loc_res = await db.execute(
        select(IncidentLocationUpdate).where(
            IncidentLocationUpdate.incident_id == active_inc.id
        ).order_by(IncidentLocationUpdate.recorded_at.desc()).limit(1)
    )
    latest_loc = loc_res.scalar_one_or_none()

    # Fetch accepted responders count
    resp_res = await db.execute(
        select(func.count(IncidentVolunteer.id)).where(
            and_(
                IncidentVolunteer.incident_id == active_inc.id,
                IncidentVolunteer.status.in_([
                    VolunteerIncidentStatus.ACCEPTED,
                    VolunteerIncidentStatus.ON_THE_WAY,
                    VolunteerIncidentStatus.REACHED_LOCATION
                ])
            )
        )
    )
    responders_count = resp_res.scalar() or 0

    return {
        "active": True,
        "incident_id": str(active_inc.id),
        "status": active_inc.status.value,
        "started_at": active_inc.started_at,
        "latest_latitude": latest_loc.latitude if latest_loc else active_inc.start_latitude,
        "latest_longitude": latest_loc.longitude if latest_loc else active_inc.start_longitude,
        "latest_accuracy": latest_loc.accuracy_meters if latest_loc else active_inc.start_accuracy,
        "active_responders_count": responders_count
    }


@router.get("/{incident_id}/status", response_model=SOSStatusResponse)
async def get_emergency_status(
    incident_id: str,
    current_user: User = Depends(get_current_woman),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve full status and responder progress of an incident."""
    res = await db.execute(
        select(EmergencyIncident).where(
            and_(
                EmergencyIncident.id == incident_id,
                EmergencyIncident.woman_id == current_user.id
            )
        )
    )
    incident = res.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found.")

    loc_res = await db.execute(
        select(IncidentLocationUpdate).where(
            IncidentLocationUpdate.incident_id == incident.id
        ).order_by(IncidentLocationUpdate.recorded_at.desc()).limit(1)
    )
    latest_loc = loc_res.scalar_one_or_none()

    resp_res = await db.execute(
        select(func.count(IncidentVolunteer.id)).where(
            and_(
                IncidentVolunteer.incident_id == incident.id,
                IncidentVolunteer.status.in_([
                    VolunteerIncidentStatus.ACCEPTED,
                    VolunteerIncidentStatus.ON_THE_WAY,
                    VolunteerIncidentStatus.REACHED_LOCATION
                ])
            )
        )
    )
    responders_count = resp_res.scalar() or 0

    notif_res = await db.execute(
        select(func.count(NotificationLog.id)).where(NotificationLog.incident_id == incident.id)
    )
    contacts_count = notif_res.scalar() or 0

    return SOSStatusResponse(
        incident_id=str(incident.id),
        status=incident.status,
        started_at=incident.started_at,
        active_responders_count=responders_count,
        contacts_notified_count=contacts_count,
        latest_latitude=latest_loc.latitude if latest_loc else incident.start_latitude,
        latest_longitude=latest_loc.longitude if latest_loc else incident.start_longitude,
        latest_accuracy=latest_loc.accuracy_meters if latest_loc else incident.start_accuracy
    )


@router.get("/{incident_id}/responders", response_model=List[ResponderPublicInfo])
async def get_incident_responders(
    incident_id: str,
    current_user: User = Depends(get_current_woman),
    db: AsyncSession = Depends(get_db)
):
    """View status of volunteers assigned to this emergency."""
    res = await db.execute(
        select(EmergencyIncident).where(
            and_(
                EmergencyIncident.id == incident_id,
                EmergencyIncident.woman_id == current_user.id
            )
        )
    )
    incident = res.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found.")

    resp_res = await db.execute(
        select(IncidentVolunteer).where(
            and_(
                IncidentVolunteer.incident_id == incident.id,
                IncidentVolunteer.status.in_([
                    VolunteerIncidentStatus.ACCEPTED,
                    VolunteerIncidentStatus.ON_THE_WAY,
                    VolunteerIncidentStatus.REACHED_LOCATION,
                    VolunteerIncidentStatus.ASSISTANCE_COMPLETED
                ])
            )
        )
    )
    volunteers = resp_res.scalars().all()

    return [
        ResponderPublicInfo(
            responder_id=str(v.volunteer_id),
            status=v.status,
            responded_at=v.responded_at,
            arrived_at=v.arrived_at
        )
        for v in volunteers
    ]
