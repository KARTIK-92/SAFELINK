from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.deps import get_current_user, get_current_volunteer
from app.models.user import User
from app.models.volunteer import VolunteerProfile, VolunteerAvailabilityLog, VolunteerLocation
from app.schemas.volunteer import (
    VolunteerAvailabilityToggle, VolunteerLocationUpdate, VolunteerProfileResponse
)

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
        # Create volunteer profile if not existing
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
