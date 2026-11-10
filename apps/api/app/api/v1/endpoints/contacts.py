import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_woman
from app.models.user import User
from app.models.contact import EmergencyContact
from app.models.audit import AuditLog
from app.schemas.contact import (
    EmergencyContactCreate, EmergencyContactUpdate, EmergencyContactResponse
)
from app.services.notification_provider import get_notification_provider

router = APIRouter(prefix="/contacts", tags=["Emergency Contacts"])


@router.get("", response_model=List[EmergencyContactResponse])
async def list_emergency_contacts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve up to 3 emergency contacts registered by the authenticated user."""
    result = await db.execute(
        select(EmergencyContact)
        .where(EmergencyContact.user_id == current_user.id)
        .order_by(EmergencyContact.priority_order.asc(), EmergencyContact.created_at.asc())
    )
    contacts = result.scalars().all()
    return contacts


@router.post("", response_model=EmergencyContactResponse, status_code=status.HTTP_201_CREATED)
async def create_emergency_contact(
    payload: EmergencyContactCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a new emergency contact.
    Strictly enforces maximum limit of 3 contacts on the server.
    Dispatches a one-time onboarding notification with opt-out instructions.
    """
    # 1. Enforce strict maximum 3 contacts limit
    count_result = await db.execute(
        select(func.count(EmergencyContact.id)).where(EmergencyContact.user_id == current_user.id)
    )
    current_count = count_result.scalar() or 0
    if current_count >= settings.MAX_EMERGENCY_CONTACTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You can register a maximum of {settings.MAX_EMERGENCY_CONTACTS} emergency contacts."
        )

    # 2. Check duplicate phone for this user
    duplicate_check = await db.execute(
        select(EmergencyContact).where(
            EmergencyContact.user_id == current_user.id,
            EmergencyContact.phone == payload.phone
        )
    )
    if duplicate_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A contact with this phone number has already been added."
        )

    # 3. Create contact
    contact = EmergencyContact(
        user_id=current_user.id,
        name=payload.name,
        relationship=payload.relationship,
        phone=payload.phone,
        email=str(payload.email) if payload.email else None,
        preferred_channels=payload.preferred_channels,
        priority_order=current_count + 1,
        is_active=True
    )
    db.add(contact)
    await db.flush()

    # 4. Dispatch onboarding notification to contact
    notifier = get_notification_provider()
    welcome_msg = (
        f"[{settings.BRAND_NAME}] Notice: You have been designated as a trusted emergency contact by "
        f"{current_user.profile.full_legal_name if current_user.profile else 'a SafeLink member'}. "
        f"In an active SOS, you will receive real-time location alerts. To opt out, reply STOP."
    )
    if "sms" in payload.preferred_channels:
        await notifier.send_sms(payload.phone, welcome_msg)
    if "whatsapp" in payload.preferred_channels:
        await notifier.send_whatsapp(
            payload.phone,
            "emergency_contact_onboard",
            {"name": payload.name, "sender": current_user.profile.full_legal_name if current_user.profile else "Member"}
        )
    if payload.email and "email" in payload.preferred_channels:
        await notifier.send_email(
            str(payload.email),
            f"{settings.BRAND_NAME} Emergency Contact Designation",
            f"<p>{welcome_msg}</p>"
        )

    # 5. Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="EMERGENCY_CONTACT_ADDED",
        resource_type="EmergencyContact",
        resource_id=str(contact.id),
        metadata_json={"contact_name": contact.name, "relationship": contact.relationship}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(contact)

    return contact


@router.patch("/{contact_id}", response_model=EmergencyContactResponse)
async def update_emergency_contact(
    contact_id: str,
    payload: EmergencyContactUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update details or notification channels of an emergency contact."""
    result = await db.execute(
        select(EmergencyContact).where(
            EmergencyContact.id == contact_id,
            EmergencyContact.user_id == current_user.id
        )
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency contact not found.")

    update_data = payload.model_dump(exclude_unset=True)
    if "email" in update_data and update_data["email"] is not None:
        update_data["email"] = str(update_data["email"])

    for field, val in update_data.items():
        setattr(contact, field, val)

    await db.commit()
    await db.refresh(contact)
    return contact


@router.delete("/{contact_id}")
async def delete_emergency_contact(
    contact_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove an emergency contact."""
    result = await db.execute(
        select(EmergencyContact).where(
            EmergencyContact.id == contact_id,
            EmergencyContact.user_id == current_user.id
        )
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency contact not found.")

    await db.delete(contact)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="EMERGENCY_CONTACT_DELETED",
        resource_type="EmergencyContact",
        resource_id=contact_id
    )
    db.add(audit)
    await db.commit()

    return {"message": "Emergency contact removed successfully."}
