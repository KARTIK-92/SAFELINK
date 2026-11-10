from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import verify_password
from app.models.user import User, UserProfile
from app.models.audit import AccountDeletionRequest, AuditLog
from app.schemas.user import UserResponse, UpdateUserRequest, AccountDeletionRequestSchema
from app.api.deps import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve currently authenticated user and profile information."""
    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == current_user.id)
    )
    user = result.scalar_one()
    return user


@router.patch("/me", response_model=UserResponse)
async def update_my_profile(
    payload: UpdateUserRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update non-sensitive user profile fields."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile record not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(profile, field, val)

    await db.commit()
    
    # Reload with profile
    user_res = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == current_user.id)
    )
    return user_res.scalar_one()


@router.delete("/me")
async def delete_my_account(
    payload: AccountDeletionRequestSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Initiate account deletion workflow with password re-authentication."""
    if not payload.confirmation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Explicit confirmation is required to delete your account."
        )

    if not verify_password(payload.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Account deletion aborted."
        )

    # Schedule deletion request
    deletion_req = AccountDeletionRequest(
        user_id=current_user.id,
        status="scheduled",
        scheduled_deletion_at=datetime.now(timezone.utc)
    )
    db.add(deletion_req)

    # Deactivate user
    current_user.is_active = False
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="ACCOUNT_DELETION_INITIATED",
        resource_type="User",
        resource_id=str(current_user.id),
        metadata_json={"reason": payload.reason}
    )
    db.add(audit)

    await db.commit()
    return {
        "status": "scheduled",
        "message": "Your account has been deactivated and scheduled for permanent deletion."
    }
