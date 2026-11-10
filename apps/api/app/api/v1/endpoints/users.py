from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password
from app.models.user import User, UserProfile
from app.models.audit import AccountDeletionRequest, AuditLog
from app.schemas.user import (
    UserResponse, UpdateUserRequest, AccountDeletionRequestSchema,
    ChangePhoneRequest, ChangeEmailRequest
)
from app.services.storage_provider import get_storage_provider
from app.services.otp_service import otp_service
from app.services.notification_provider import get_notification_provider
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
    
    # If photo exists, populate signed temporary URL
    if user.profile and user.profile.profile_photo_path:
        storage = get_storage_provider()
        user.profile.profile_photo_url = await storage.get_presigned_url(user.profile.profile_photo_path)
        
    return user


@router.post("/me/photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload profile / KYC verification photo to private storage.
    Never exposes photograph to public URL without cryptographic authorization.
    """
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=400, detail="Photo size cannot exceed 5MB.")

    storage = get_storage_provider()
    object_key = await storage.upload_file(
        file_bytes=content,
        file_name=file.filename or "profile.jpg",
        content_type=file.content_type or "image/jpeg"
    )

    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if profile:
        profile.profile_photo_path = object_key
        await db.commit()

    presigned_url = await storage.get_presigned_url(object_key)
    return {
        "status": "success",
        "message": "Photo uploaded to private storage.",
        "object_key": object_key,
        "presigned_url": presigned_url
    }


@router.post("/me/change-phone")
async def change_phone_number(
    payload: ChangePhoneRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Change registered mobile number with OTP verification.
    Notifies the old mobile number of the security modification.
    """
    is_valid, msg = otp_service.verify(payload.new_phone, payload.otp_code, "contact_change")
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)

    # Check if already taken
    existing = await db.execute(select(User).where(User.phone == payload.new_phone))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Mobile number is already registered to another account.")

    old_phone = current_user.phone
    current_user.phone = payload.new_phone
    current_user.is_phone_verified = True

    # Audit & Security Notification to old number
    notifier = get_notification_provider()
    await notifier.send_sms(
        old_phone,
        f"[{settings.BRAND_NAME}] Security Notice: Your registered phone number was updated to {payload.new_phone}. If you did not request this, contact support immediately."
    )

    audit = AuditLog(
        user_id=current_user.id,
        action="PHONE_NUMBER_CHANGED",
        resource_type="User",
        resource_id=str(current_user.id),
        metadata_json={"old_phone": old_phone, "new_phone": payload.new_phone}
    )
    db.add(audit)
    await db.commit()

    return {"message": "Phone number successfully updated."}


@router.post("/me/change-email")
async def change_email_address(
    payload: ChangeEmailRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Change registered email address with OTP verification.
    Notifies the old email address of the security modification.
    """
    is_valid, msg = otp_service.verify(payload.new_email, payload.otp_code, "contact_change")
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)

    existing = await db.execute(select(User).where(User.email == payload.new_email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email address is already registered to another account.")

    old_email = current_user.email
    current_user.email = payload.new_email
    current_user.is_email_verified = True

    # Audit & Security Notification to old email
    notifier = get_notification_provider()
    await notifier.send_email(
        old_email,
        f"{settings.BRAND_NAME} Security Alert: Email Address Changed",
        f"<p>Your registered email address was updated to {payload.new_email}. If you did not make this change, please contact support immediately.</p>"
    )

    audit = AuditLog(
        user_id=current_user.id,
        action="EMAIL_ADDRESS_CHANGED",
        resource_type="User",
        resource_id=str(current_user.id),
        metadata_json={"old_email": old_email, "new_email": payload.new_email}
    )
    db.add(audit)
    await db.commit()

    return {"message": "Email address successfully updated."}


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
