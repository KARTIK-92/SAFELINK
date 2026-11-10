from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User, AccountStatus, IdentityVerification, LivenessVerification, VerificationStatus
from app.models.audit import AuditLog
from app.schemas.verification import (
    VerificationInitiateRequest, VerificationInitiateResponse,
    VerificationSubmitRequest, VerificationSubmitResponse,
    LivenessChallengeResponse, LivenessSubmitRequest, LivenessSubmitResponse
)
from app.services.verification_provider import get_verification_provider
from app.services.liveness_provider import get_liveness_provider

router = APIRouter(prefix="/verification", tags=["Identity & Liveness Verification"])


@router.post("/initiate", response_model=VerificationInitiateResponse)
async def initiate_identity_verification(
    payload: VerificationInitiateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Initiate an identity verification session with DigiLocker or the Mock verification provider."""
    provider = get_verification_provider(settings.VERIFICATION_PROVIDER)
    result = await provider.initiate_verification(
        user_id=str(current_user.id),
        id_type=payload.id_type,
        id_number_hint=payload.id_number_hint or "XXXX"
    )

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="IDENTITY_VERIFICATION_INITIATED",
        resource_type="IdentityVerification",
        resource_id=result["session_id"],
        metadata_json={"provider": settings.VERIFICATION_PROVIDER, "id_type": payload.id_type}
    )
    db.add(audit)
    await db.commit()

    return VerificationInitiateResponse(
        session_id=result["session_id"],
        provider=result["provider"],
        is_mock=result["is_mock"],
        instructions=result.get("instructions", "Proceed with verification flow."),
        oauth_url=result.get("oauth_url")
    )


@router.post("/submit", response_model=VerificationSubmitResponse)
async def submit_identity_verification(
    payload: VerificationSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit KYC documentation or verification result for review.
    In DEMO mode, clearly tags records as mock-verified.
    """
    provider = get_verification_provider(settings.VERIFICATION_PROVIDER)
    verify_result = await provider.verify_credentials(
        session_id=payload.session_id,
        payload={"force_reject": payload.force_reject, "document_ref": payload.document_ref}
    )

    is_success = verify_result.get("success", False)
    v_status = VerificationStatus.VERIFIED if is_success else VerificationStatus.REJECTED

    # Create IdentityVerification audit record
    verification_record = IdentityVerification(
        user_id=current_user.id,
        provider=settings.VERIFICATION_PROVIDER,
        status=v_status,
        provider_reference=verify_result.get("provider_reference"),
        verification_payload_hash=verify_result.get("verification_payload_hash"),
        rejection_reason=verify_result.get("rejection_reason"),
        verified_at=datetime.now(timezone.utc) if is_success else None
    )
    db.add(verification_record)

    # Update User account status upon successful identity verification
    if is_success:
        current_user.status = AccountStatus.VERIFIED
        current_user.is_phone_verified = True
        current_user.is_email_verified = True
    else:
        current_user.status = AccountStatus.REJECTED

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="IDENTITY_VERIFICATION_SUBMITTED",
        resource_type="IdentityVerification",
        resource_id=str(verification_record.id),
        metadata_json={
            "status": v_status.value,
            "is_mock": verify_result.get("is_mock", True)
        }
    )
    db.add(audit)
    await db.commit()

    return VerificationSubmitResponse(
        success=is_success,
        status=v_status,
        is_mock=verify_result.get("is_mock", True),
        provider_reference=verify_result.get("provider_reference"),
        rejection_reason=verify_result.get("rejection_reason"),
        verified_at=datetime.now(timezone.utc) if is_success else None,
        warning=verify_result.get("warning")
    )


@router.post("/liveness/challenge", response_model=LivenessChallengeResponse)
async def request_liveness_challenge(
    current_user: User = Depends(get_current_user)
):
    """Generate interactive liveness challenge for camera capture."""
    provider = get_liveness_provider(settings.LIVENESS_PROVIDER)
    challenge = await provider.create_challenge(str(current_user.id))
    return LivenessChallengeResponse(
        session_id=challenge["session_id"],
        provider=challenge["provider"],
        actions_required=challenge["actions_required"],
        is_mock=challenge["is_mock"]
    )


@router.post("/liveness/verify", response_model=LivenessSubmitResponse)
async def verify_liveness(
    payload: LivenessSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Verify submitted liveness frames and record liveness audit."""
    provider = get_liveness_provider(settings.LIVENESS_PROVIDER)
    result = await provider.evaluate_challenge(
        session_id=payload.session_id,
        frame_data=[f"frame_{i}" for i in range(payload.frames_count)]
    )

    liveness_record = LivenessVerification(
        user_id=current_user.id,
        provider=settings.LIVENESS_PROVIDER,
        passed=result["passed"],
        confidence_score=result["confidence_score"],
        session_data={"performed_action": payload.performed_action, "frames": payload.frames_count}
    )
    db.add(liveness_record)
    await db.commit()

    return LivenessSubmitResponse(
        passed=result["passed"],
        confidence_score=result["confidence_score"],
        provider=result["provider"],
        is_mock=result["is_mock"],
        warning=result.get("warning", "Client-side liveness detection is for demonstration.")
    )
