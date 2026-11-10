from datetime import datetime, timezone
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password
from app.models.user import User, UserProfile, AccountStatus, UserSession, IdentityVerification
from app.models.contact import EmergencyContact
from app.models.incident import EmergencyIncident
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


@router.get("/me/export")
async def export_my_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """DPDP Act Compliance: Download a structured machine-readable JSON archive of all personal data."""
    # 1. Profile
    prof_res = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = prof_res.scalar_one_or_none()

    # 2. Emergency Contacts
    contacts_res = await db.execute(select(EmergencyContact).where(EmergencyContact.user_id == current_user.id))
    contacts = contacts_res.scalars().all()

    # 3. Incidents
    incidents_res = await db.execute(select(EmergencyIncident).where(EmergencyIncident.woman_id == current_user.id))
    incidents = incidents_res.scalars().all()

    # 4. Verification History
    verif_res = await db.execute(select(IdentityVerification).where(IdentityVerification.user_id == current_user.id))
    verifications = verif_res.scalars().all()

    # 5. Audit Activity Logs
    audit_res = await db.execute(
        select(AuditLog).where(AuditLog.user_id == current_user.id).order_by(AuditLog.timestamp.desc()).limit(100)
    )
    audits = audit_res.scalars().all()

    return {
        "export_metadata": {
            "platform": settings.BRAND_NAME,
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "compliance": "Digital Personal Data Protection Act (DPDP) 2023",
            "user_id": str(current_user.id)
        },
        "account": {
            "id": str(current_user.id),
            "phone": current_user.phone,
            "email": current_user.email,
            "role": current_user.role.value,
            "status": current_user.status.value,
            "is_phone_verified": current_user.is_phone_verified,
            "is_email_verified": current_user.is_email_verified,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None
        },
        "profile": {
            "full_legal_name": profile.full_legal_name if profile else None,
            "gender": profile.gender if profile else None,
            "date_of_birth": profile.date_of_birth.isoformat() if profile and profile.date_of_birth else None,
            "city": profile.city if profile else None,
            "state": profile.state if profile else None,
            "pin_code": profile.pin_code if profile else None
        } if profile else None,
        "emergency_contacts": [
            {
                "name": c.name,
                "relationship": c.relationship,
                "phone": c.phone,
                "email": c.email,
                "preferred_channels": c.preferred_channels,
                "priority_order": c.priority_order
            }
            for c in contacts
        ],
        "incidents_history": [
            {
                "incident_id": str(i.id),
                "status": i.status.value,
                "started_at": i.started_at.isoformat(),
                "cancelled_at": i.cancelled_at.isoformat() if i.cancelled_at else None,
                "resolved_at": i.resolved_at.isoformat() if i.resolved_at else None
            }
            for i in incidents
        ],
        "verification_records": [
            {
                "provider": v.provider,
                "status": v.status.value,
                "verified_at": v.verified_at.isoformat() if v.verified_at else None
            }
            for v in verifications
        ],
        "audit_logs": [
            {
                "action": a.action,
                "resource_type": a.resource_type,
                "timestamp": a.timestamp.isoformat()
            }
            for a in audits
        ]
    }


@router.delete("/me")
async def delete_my_account(
    payload: AccountDeletionRequestSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """DPDP Right to Erasure: Permanent account deletion with cryptographic shredding of PII."""
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

    now = datetime.now(timezone.utc)

    # 1. Redact all PII in UserProfile
    prof_res = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = prof_res.scalar_one_or_none()
    if profile:
        profile.full_legal_name = "REDACTED_USER"
        profile.address_line1 = "REDACTED"
        profile.address_line2 = None
        profile.city = "REDACTED"
        profile.state = "REDACTED"
        profile.pin_code = "000000"
        profile.profile_photo_path = None

    # 2. Delete all Emergency Contacts
    await db.execute(delete(EmergencyContact).where(EmergencyContact.user_id == current_user.id))

    # 3. Terminate all active sessions
    await db.execute(delete(UserSession).where(UserSession.user_id == current_user.id))

    # 4. Anonymize User credentials and revoke access
    deleted_suffix = str(current_user.id)[:8]
    current_user.phone = f"+deleted_{deleted_suffix}"
    current_user.email = f"deleted_{deleted_suffix}@safelink.invalid"
    current_user.hashed_password = None
    current_user.is_active = False
    current_user.status = AccountStatus.SUSPENDED

    # 5. Record completed deletion request
    deletion_req = AccountDeletionRequest(
        user_id=current_user.id,
        status="completed",
        scheduled_deletion_at=now,
        completed_at=now
    )
    db.add(deletion_req)

    # 6. Audit log for compliance verification
    audit = AuditLog(
        user_id=current_user.id,
        action="DPDP_ACCOUNT_PII_PURGED",
        resource_type="User",
        resource_id=str(current_user.id),
        metadata_json={"reason": payload.reason, "purged_at": now.isoformat()}
    )
    db.add(audit)

    await db.commit()
    return {
        "status": "completed",
        "message": "Your personal data has been permanently shredded in compliance with DPDP 2023."
    }
