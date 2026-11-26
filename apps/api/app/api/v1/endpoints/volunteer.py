from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.api.deps import get_current_user, get_current_volunteer
from app.models.user import User
from app.models.volunteer import VolunteerProfile, VolunteerAvailabilityLog, VolunteerLocation
from app.models.incident import (
    EmergencyIncident, IncidentStatus, VolunteerIncidentStatus,
    IncidentVolunteer, IncidentLocationUpdate
)
from app.schemas.volunteer import (
    VolunteerAvailabilityToggle, VolunteerLocationUpdate, VolunteerProfileResponse,
    VolunteerIncidentSummary, VolunteerStatusUpdate
)
from app.services.emergency_service import emergency_engine
from app.core.geo import haversine_distance_meters

router = APIRouter(prefix="/volunteer", tags=["Volunteer Responder"])


@router.get("/me", response_model=VolunteerProfileResponse)
async def get_volunteer_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve operational profile and availability state of current volunteer."""
    result = await db.execute(
        select(VolunteerProfile).where(VolunteerProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        profile = VolunteerProfile(user_id=current_user.id, is_available=False)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return profile


@router.post("/availability")
async def toggle_availability(
    payload: VolunteerAvailabilityToggle,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Toggle volunteer responder availability status."""
    result = await db.execute(
        select(VolunteerProfile).where(VolunteerProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        profile = VolunteerProfile(user_id=current_user.id, is_available=payload.is_available)
        db.add(profile)
    else:
        profile.is_available = payload.is_available
        profile.last_seen_at = datetime.now(timezone.utc)

    # Log availability change
    avail_log = VolunteerAvailabilityLog(
        volunteer_id=profile.id,
        is_available=payload.is_available,
        reason=payload.reason
    )
    db.add(avail_log)
    await db.commit()

    return {
        "status": "success",
        "is_available": profile.is_available,
        "message": "Availability updated."
    }


@router.post("/location")
async def update_location(
    payload: VolunteerLocationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update volunteer's battery-aware location when AVAILABLE.
    Rejected if volunteer is offline to preserve privacy.
    """
    result = await db.execute(
        select(VolunteerProfile).where(VolunteerProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile or not profile.is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location updates are rejected when volunteer is marked UNAVAILABLE."
        )

    loc = VolunteerLocation(
        volunteer_id=profile.id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        accuracy_meters=payload.accuracy_meters,
        speed=payload.speed,
        heading=payload.heading
    )
    db.add(loc)
    profile.last_seen_at = datetime.now(timezone.utc)
    await db.commit()

    return {"status": "success", "recorded_at": loc.recorded_at}


@router.get("/incidents", response_model=List[VolunteerIncidentSummary])
async def list_nearby_incidents(
    current_user: User = Depends(get_current_volunteer),
    db: AsyncSession = Depends(get_db)
):
    """List active nearby emergency incidents where this volunteer received an alert or has accepted."""
    prof_res = await db.execute(
        select(VolunteerProfile).where(VolunteerProfile.user_id == current_user.id)
    )
    profile = prof_res.scalar_one_or_none()
    if not profile:
        profile = VolunteerProfile(user_id=current_user.id, is_available=True)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    elif not profile.is_available:
        profile.is_available = True
        await db.commit()

    # 1. Fetch alerts for this volunteer for active incidents
    query = (
        select(IncidentVolunteer, EmergencyIncident)
        .join(EmergencyIncident, IncidentVolunteer.incident_id == EmergencyIncident.id)
        .where(
            and_(
                IncidentVolunteer.volunteer_id == profile.id,
                EmergencyIncident.status == IncidentStatus.ACTIVE,
                IncidentVolunteer.status.notin_([
                    VolunteerIncidentStatus.UNABLE_TO_ASSIST,
                    VolunteerIncidentStatus.CANCELLED
                ])
            )
        )
        .order_by(EmergencyIncident.started_at.desc())
    )
    res = await db.execute(query)
    rows = res.all()

    existing_incident_ids = {iv.incident_id for iv, inc in rows}
    summaries = []
    for iv, inc in rows:
        summaries.append(
            VolunteerIncidentSummary(
                incident_id=str(inc.id),
                status=iv.status.value,
                approximate_distance_meters=iv.initial_distance_meters,
                started_at=inc.started_at,
                address_hint=inc.address_snapshot
            )
        )

    # 2. Check for any active emergency incidents not yet assigned to this available volunteer
    all_active_res = await db.execute(
        select(EmergencyIncident).where(EmergencyIncident.status == IncidentStatus.ACTIVE).order_by(EmergencyIncident.started_at.desc())
    )
    all_active = all_active_res.scalars().all()
    for inc in all_active:
        if inc.id not in existing_incident_ids:
            # Query volunteer's latest position for distance estimate
            loc_res = await db.execute(
                select(VolunteerLocation).where(
                    VolunteerLocation.volunteer_id == profile.id
                ).order_by(VolunteerLocation.recorded_at.desc()).limit(1)
            )
            v_loc = loc_res.scalar_one_or_none()
            dist = 450
            if v_loc:
                dist = int(haversine_distance_meters(inc.origin_latitude, inc.origin_longitude, v_loc.latitude, v_loc.longitude))

            new_iv = IncidentVolunteer(
                incident_id=inc.id,
                volunteer_id=profile.id,
                status=VolunteerIncidentStatus.ALERT_RECEIVED,
                initial_distance_meters=dist,
                notified_at=datetime.now(timezone.utc)
            )
            db.add(new_iv)
            await db.commit()
            summaries.append(
                VolunteerIncidentSummary(
                    incident_id=str(inc.id),
                    status=new_iv.status.value,
                    approximate_distance_meters=dist,
                    started_at=inc.started_at,
                    address_hint=inc.address_snapshot
                )
            )
            existing_incident_ids.add(inc.id)

    return summaries


@router.post("/incidents/{incident_id}/accept")
async def accept_incident(
    incident_id: str,
    current_user: User = Depends(get_current_volunteer),
    db: AsyncSession = Depends(get_db)
):
    """Volunteer accepts emergency dispatch request:
    - Enforces maximum concurrent responders limit (max 3).
    - Unlocks precise location and navigation access.
    """
    try:
        assignment = await emergency_engine.assign_volunteer(
            incident_id=incident_id,
            volunteer_user=current_user,
            db=db
        )
        return {
            "status": "accepted",
            "incident_id": str(assignment.incident_id),
            "volunteer_status": assignment.status.value,
            "responded_at": assignment.responded_at
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/incidents/{incident_id}/decline")
async def decline_incident(
    incident_id: str,
    current_user: User = Depends(get_current_volunteer),
    db: AsyncSession = Depends(get_db)
):
    """Volunteer declines emergency dispatch request."""
    prof_res = await db.execute(
        select(VolunteerProfile).where(VolunteerProfile.user_id == current_user.id)
    )
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Volunteer profile not found.")

    res = await db.execute(
        select(IncidentVolunteer).where(
            and_(
                IncidentVolunteer.incident_id == incident_id,
                IncidentVolunteer.volunteer_id == profile.id
            )
        )
    )
    assignment = res.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident alert not found.")

    assignment.status = VolunteerIncidentStatus.UNABLE_TO_ASSIST
    await db.commit()

    return {"status": "declined", "incident_id": incident_id}


@router.patch("/incidents/{incident_id}/status")
async def update_response_status(
    incident_id: str,
    payload: VolunteerStatusUpdate,
    current_user: User = Depends(get_current_volunteer),
    db: AsyncSession = Depends(get_db)
):
    """Update volunteer status (on_the_way, reached_location, assistance_completed)."""
    prof_res = await db.execute(
        select(VolunteerProfile).where(VolunteerProfile.user_id == current_user.id)
    )
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Volunteer profile not found.")

    res = await db.execute(
        select(IncidentVolunteer).where(
            and_(
                IncidentVolunteer.incident_id == incident_id,
                IncidentVolunteer.volunteer_id == profile.id
            )
        )
    )
    assignment = res.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident assignment not found.")

    assignment.status = payload.status
    if payload.status == VolunteerIncidentStatus.REACHED_LOCATION and not assignment.arrived_at:
        assignment.arrived_at = datetime.now(timezone.utc)

    await db.commit()

    return {
        "status": "updated",
        "incident_id": incident_id,
        "volunteer_status": assignment.status.value,
        "arrived_at": assignment.arrived_at
    }


@router.get("/incidents/{incident_id}/details")
async def get_incident_navigation_details(
    incident_id: str,
    current_user: User = Depends(get_current_volunteer),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve precise coordinates and victim details for navigation.
    STRICT PRIVACY RULE: Only granted if volunteer has ACCEPTED the incident.
    """
    prof_res = await db.execute(
        select(VolunteerProfile).where(VolunteerProfile.user_id == current_user.id)
    )
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Volunteer profile not found.")

    res = await db.execute(
        select(IncidentVolunteer).where(
            and_(
                IncidentVolunteer.incident_id == incident_id,
                IncidentVolunteer.volunteer_id == profile.id
            )
        )
    )
    assignment = res.scalar_one_or_none()
    if not assignment or assignment.status not in [
        VolunteerIncidentStatus.ACCEPTED,
        VolunteerIncidentStatus.ON_THE_WAY,
        VolunteerIncidentStatus.REACHED_LOCATION
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Precise incident location is strictly restricted until you have accepted dispatch."
        )

    inc_res = await db.execute(
        select(EmergencyIncident)
        .options(selectinload(EmergencyIncident.woman).selectinload(User.profile))
        .where(EmergencyIncident.id == incident_id)
    )
    incident = inc_res.scalar_one_or_none()
    if not incident or incident.status != IncidentStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active incident not found.")

    loc_res = await db.execute(
        select(IncidentLocationUpdate).where(
            IncidentLocationUpdate.incident_id == incident.id
        ).order_by(IncidentLocationUpdate.recorded_at.desc()).limit(1)
    )
    latest_loc = loc_res.scalar_one_or_none()

    victim_name = "Distressed Member"
    if incident.woman and incident.woman.profile and incident.woman.profile.full_legal_name:
        parts = incident.woman.profile.full_legal_name.strip().split()
        victim_name = f"{parts[0]} {parts[1][0]}." if len(parts) >= 2 else parts[0]

    return {
        "incident_id": str(incident.id),
        "status": incident.status.value,
        "response_status": assignment.status.value,
        "victim_display_name": victim_name,
        "latitude": latest_loc.latitude if latest_loc else incident.start_latitude,
        "longitude": latest_loc.longitude if latest_loc else incident.start_longitude,
        "accuracy_meters": latest_loc.accuracy_meters if latest_loc else incident.start_accuracy,
        "address_snapshot": incident.address_snapshot,
        "started_at": incident.started_at,
        "last_updated_at": latest_loc.recorded_at if latest_loc else incident.started_at
    }
