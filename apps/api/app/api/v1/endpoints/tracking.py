from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import hash_token
from app.models.incident import (
    EmergencyIncident, IncidentStatus, VolunteerIncidentStatus,
    LocationAccessToken, IncidentLocationUpdate, IncidentVolunteer
)
from app.models.user import User
from app.schemas.incident import LiveTrackingPublicResponse

router = APIRouter(prefix="/tracking", tags=["Public Live Tracking"])


@router.get("/{token}", response_model=LiveTrackingPublicResponse)
async def get_live_tracking_data(
    token: str,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Public, ephemeral live-tracking endpoint for emergency contacts.
    - Protected by 256-bit unguessable cryptographic token.
    - Sets 'X-Robots-Tag: noindex, nofollow' header.
    - If emergency is cancelled, immediately returns inactive payload with zero live coordinates.
    """
    # Strictly instruct all web crawlers and search indexers to ignore this URL
    response.headers["X-Robots-Tag"] = "noindex, nofollow, noarchive"
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"

    token_hash = hash_token(token)
    now = datetime.now(timezone.utc)

    # 1. Lookup access token
    tok_res = await db.execute(
        select(LocationAccessToken).where(LocationAccessToken.token_hash == token_hash)
    )
    access_token = tok_res.scalar_one_or_none()

    if not access_token:
        return LiveTrackingPublicResponse(
            active=False,
            message="Invalid or unrecognized emergency tracking link."
        )

    token_expires = access_token.expires_at
    if token_expires.tzinfo is None:
        token_expires = token_expires.replace(tzinfo=timezone.utc)

    if access_token.is_revoked or token_expires < now:
        return LiveTrackingPublicResponse(
            active=False,
            message="This emergency tracking link has ended or expired. The user has cancelled the alert or reached safety."
        )

    # 2. Lookup incident
    inc_res = await db.execute(
        select(EmergencyIncident)
        .options(selectinload(EmergencyIncident.woman).selectinload(User.profile))
        .where(EmergencyIncident.id == access_token.incident_id)
    )
    incident = inc_res.scalar_one_or_none()

    if not incident:
        return LiveTrackingPublicResponse(
            active=False,
            message="Incident not found."
        )

    if incident.status != IncidentStatus.ACTIVE:
        return LiveTrackingPublicResponse(
            active=False,
            incident_id=str(incident.id),
            message=f"The emergency alert has concluded (Status: {incident.status.value}). Tracking is no longer available."
        )

    # 3. Retrieve latest coordinate breadcrumb
    loc_res = await db.execute(
        select(IncidentLocationUpdate).where(
            IncidentLocationUpdate.incident_id == incident.id
        ).order_by(IncidentLocationUpdate.recorded_at.desc()).limit(1)
    )
    latest_loc = loc_res.scalar_one_or_none()

    # 4. Count active responders
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

    # 5. Masked name display
    name_display = "SafeLink Member"
    if incident.woman and incident.woman.profile and incident.woman.profile.full_legal_name:
        parts = incident.woman.profile.full_legal_name.strip().split()
        if len(parts) >= 2:
            name_display = f"{parts[0]} {parts[1][0]}."
        elif len(parts) == 1:
            name_display = f"{parts[0][0]}."

    lat = latest_loc.latitude if latest_loc else incident.start_latitude
    lon = latest_loc.longitude if latest_loc else incident.start_longitude
    acc = latest_loc.accuracy_meters if latest_loc else incident.start_accuracy
    upd = latest_loc.recorded_at if latest_loc else incident.started_at

    return LiveTrackingPublicResponse(
        active=True,
        incident_id=str(incident.id),
        woman_name_initial=name_display,
        last_latitude=lat,
        last_longitude=lon,
        accuracy_meters=acc,
        updated_at=upd,
        active_responders_count=responders_count,
        message="Emergency SOS active. Emergency contacts notified and volunteer responders coordinating."
    )
