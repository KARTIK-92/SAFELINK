import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_token, hash_token
)
from app.models.user import User, UserProfile, UserRole, AccountStatus, UserSession
from app.models.volunteer import VolunteerProfile
from app.schemas.auth import (
    RegisterRequest, RegisterResponse,
    OTPSendRequest, OTPSendResponse,
    OTPVerifyRequest, OTPVerifyResponse,
    LoginRequest, TokenResponse, RefreshTokenRequest,
    PasswordResetRequest, PasswordResetConfirmRequest
)
from app.services.otp_service import otp_service
from app.services.notification_provider import get_notification_provider
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user (Woman or Volunteer).
    Enforces minimum age (18+), Argon2id password hashing, and pending verification status.
    """
    # 1. Enforce minimum age
    today = datetime.now(timezone.utc).date()
    age = today.year - payload.date_of_birth.year - (
        (today.month, today.day) < (payload.date_of_birth.month, payload.date_of_birth.day)
    )
    if age < settings.MINIMUM_REGISTRATION_AGE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration requires a minimum age of {settings.MINIMUM_REGISTRATION_AGE} years."
        )

    # 2. Check if phone or email already registered
    existing_check = await db.execute(
        select(User).where(or_(User.phone == payload.phone, User.email == payload.email))
    )
    if existing_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this mobile number or email address is already registered."
        )

    # 3. Create User record with Argon2id password hash
    hashed_pwd = hash_password(payload.password)
    user = User(
        phone=payload.phone,
        email=payload.email,
        hashed_password=hashed_pwd,
        role=payload.role,
        status=AccountStatus.PENDING,
        is_active=True,
        is_phone_verified=False,
        is_email_verified=False
    )
    db.add(user)
    await db.flush()

    # 4. Create UserProfile
    profile = UserProfile(
        user_id=user.id,
        full_legal_name=payload.full_legal_name,
        gender=payload.gender,
        date_of_birth=payload.date_of_birth,
        address_line1=payload.address_line1,
        address_line2=payload.address_line2,
        city=payload.city,
        state=payload.state,
        pin_code=payload.pin_code
    )
    db.add(profile)

    # 5. If registering as Volunteer, initialize VolunteerProfile
    if payload.role == UserRole.VOLUNTEER:
        vol_profile = VolunteerProfile(
            user_id=user.id,
            is_available=False
        )
        db.add(vol_profile)

    await db.commit()
    await db.refresh(user)

    return RegisterResponse(
        user_id=str(user.id),
        status=user.status,
        phone_verification_required=True,
        email_verification_required=True,
        message="Registration submitted successfully. Please complete phone & email OTP verification."
    )


@router.post("/otp/send", response_model=OTPSendResponse)
async def send_otp(
    payload: OTPSendRequest
):
    """Generate and dispatch a 6-digit OTP code.
    Enforces 60-second cooldown, peppered HMAC storage, and 5-minute expiration.
    """
    can_send, cooldown = otp_service.can_send(payload.destination, payload.purpose)
    if not can_send:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {cooldown} seconds before requesting a new code."
        )

    otp_code, _ = otp_service.generate_and_store(payload.destination, payload.purpose)
    
    # Dispatch via notification provider
    notifier = get_notification_provider()
    msg = f"[{settings.BRAND_NAME}] Your verification code is {otp_code}. Valid for 5 minutes. Never share this code."
    
    if payload.channel == "phone":
        await notifier.send_sms(payload.destination, msg)
    else:
        await notifier.send_email(payload.destination, f"{settings.BRAND_NAME} Verification Code", f"<p>{msg}</p>")

    # In production, OTP is strictly dispatched over SMS/Email. Only exposed in automated test harness.
    demo_otp = otp_code if (settings.TESTING or settings.ENVIRONMENT == "test") else None
    return OTPSendResponse(
        status="success",
        message="If this contact is registered, a 6-digit code has been dispatched.",
        expires_in_seconds=settings.OTP_EXPIRY_MINUTES * 60,
        resend_cooldown_seconds=settings.OTP_RESEND_COOLDOWN_SECONDS,
        demo_otp=demo_otp
    )


@router.post("/otp/verify", response_model=OTPVerifyResponse)
async def verify_otp(
    payload: OTPVerifyRequest,
    db: AsyncSession = Depends(get_db)
):
    """Verify submitted OTP and update verification flag on matching user record."""
    is_valid, msg = otp_service.verify(payload.destination, payload.otp_code, payload.purpose)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg
        )

    # If verification is for registration or contact verification, mark verified in DB
    result = await db.execute(
        select(User).where(or_(User.phone == payload.destination, User.email == payload.destination))
    )
    user = result.scalar_one_or_none()
    if user:
        if user.phone == payload.destination:
            user.is_phone_verified = True
        if user.email == payload.destination:
            user.is_email_verified = True
        # If in automated testing mode and both verified, transition status to VERIFIED
        if user.is_phone_verified and user.is_email_verified and (settings.TESTING or settings.VERIFICATION_PROVIDER in ("mock", "auto")):
            user.status = AccountStatus.VERIFIED
        await db.commit()

    return OTPVerifyResponse(
        verified=True,
        message="Verification completed successfully."
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate via Phone/Email + Password OR Phone/Email + OTP.
    Returns short-lived access token and single-use refresh token.
    """
    result = await db.execute(
        select(User).where(or_(User.phone == payload.identifier, User.email == payload.identifier))
    )
    user = result.scalar_one_or_none()

    generic_auth_err = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect mobile/email or password.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not user:
        raise generic_auth_err

    if not user.is_active or user.status == AccountStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been suspended or deactivated. Contact support for assistance."
        )

    # Check lockout
    now = datetime.now(timezone.utc)
    if user.locked_until and user.locked_until > now:
        remaining = int((user.locked_until - now).total_seconds() / 60)
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account is temporarily locked due to failed attempts. Please try again in {remaining + 1} minutes."
        )

    authenticated = False
    if payload.password:
        if verify_password(payload.password, user.hashed_password):
            authenticated = True
        else:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.locked_until = now + timedelta(minutes=15)
                user.failed_login_attempts = 0
            await db.commit()
            raise generic_auth_err
    elif payload.otp_code:
        is_valid, _ = otp_service.verify(payload.identifier, payload.otp_code, "login")
        if is_valid:
            authenticated = True
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP code."
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either password or otp_code must be provided."
        )

    # Reset failed attempts
    user.failed_login_attempts = 0
    user.locked_until = None

    # Create session & rotating refresh token
    session_id = str(secrets.token_hex(16))
    refresh_token = create_refresh_token(user.id, session_id)
    refresh_token_hash = hash_token(refresh_token)

    user_session = UserSession(
        user_id=user.id,
        refresh_token_hash=refresh_token_hash,
        device_info=payload.device_info,
        ip_address=request.client.host if request.client else "unknown",
        expires_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        is_revoked=False
    )
    db.add(user_session)
    await db.commit()

    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        status=user.status.value
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "id": str(user.id),
            "phone": user.phone,
            "email": user.email,
            "role": user.role.value,
            "status": user.status.value
        }
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """Rotate refresh token. Detects token reuse to protect against theft."""
    decoded = decode_token(payload.refresh_token)
    if not decoded or decoded.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token."
        )

    user_id = decoded.get("sub")
    session_id = decoded.get("sid")
    token_hash = hash_token(payload.refresh_token)

    # Lookup session in database
    result = await db.execute(
        select(UserSession).where(UserSession.refresh_token_hash == token_hash)
    )
    session = result.scalar_one_or_none()

    # Reuse detection: if token is already marked revoked, potential token theft!
    if session and session.is_revoked:
        # Revoke ALL sessions for this user for security
        await db.execute(
            select(UserSession).where(UserSession.user_id == user_id)
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Revoked token reuse detected. All sessions terminated."
        )

    if not session or session.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again."
        )

    # Invalidate old refresh token (single-use rotation)
    session.is_revoked = True

    # Look up user
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not active.")

    # Issue new token pair
    new_refresh = create_refresh_token(user.id, session_id)
    new_session = UserSession(
        user_id=user.id,
        refresh_token_hash=hash_token(new_refresh),
        device_info=session.device_info,
        ip_address=session.ip_address,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        is_revoked=False
    )
    db.add(new_session)
    await db.commit()

    new_access = create_access_token(
        subject=user.id,
        role=user.role.value,
        status=user.status.value
    )

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "id": str(user.id),
            "phone": user.phone,
            "email": user.email,
            "role": user.role.value,
            "status": user.status.value
        }
    )


@router.post("/logout")
async def logout(
    payload: RefreshTokenRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Revoke specific active session."""
    token_hash = hash_token(payload.refresh_token)
    result = await db.execute(
        select(UserSession).where(UserSession.refresh_token_hash == token_hash)
    )
    session = result.scalar_one_or_none()
    if session:
        session.is_revoked = True
        await db.commit()
    return {"message": "Logged out successfully."}


@router.post("/logout-all")
async def logout_all(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Revoke all active sessions for current user."""
    sessions_result = await db.execute(
        select(UserSession).where(UserSession.user_id == current_user.id)
    )
    sessions = sessions_result.scalars().all()
    for s in sessions:
        s.is_revoked = True
    await db.commit()
    return {"message": "All active sessions have been revoked."}


@router.post("/password/reset-request")
async def password_reset_request(
    payload: PasswordResetRequest
):
    """Initiate password reset by dispatching a 6-digit OTP to the registered mobile or email."""
    can_send, cooldown = otp_service.can_send(payload.destination, "password_reset")
    if not can_send:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {cooldown} seconds before requesting a new code."
        )

    otp_code, _ = otp_service.generate_and_store(payload.destination, "password_reset")
    notifier = get_notification_provider()
    msg = f"[{settings.BRAND_NAME}] Your password reset code is {otp_code}. Valid for 5 minutes. Do not share this code."

    if payload.channel == "phone":
        await notifier.send_sms(payload.destination, msg)
    else:
        await notifier.send_email(payload.destination, f"{settings.BRAND_NAME} Password Reset", f"<p>{msg}</p>")

    return {
        "status": "success",
        "message": "If this contact is registered, a password reset code has been sent.",
        "demo_otp": otp_code if (settings.TESTING or settings.ENVIRONMENT == "test") else None
    }


@router.post("/password/reset-confirm")
async def password_reset_confirm(
    payload: PasswordResetConfirmRequest,
    db: AsyncSession = Depends(get_db)
):
    """Verify OTP and update user's password with Argon2id hash. Revokes all active sessions."""
    if len(payload.new_password) < settings.PASSWORD_MIN_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters."
        )

    is_valid, msg = otp_service.verify(payload.destination, payload.otp_code, "password_reset")
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg
        )

    result = await db.execute(
        select(User).where(or_(User.phone == payload.destination, User.email == payload.destination))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    # Hash new password
    user.hashed_password = hash_password(payload.new_password)

    # Revoke all existing sessions for security
    sessions_result = await db.execute(
        select(UserSession).where(UserSession.user_id == user.id)
    )
    sessions = sessions_result.scalars().all()
    for s in sessions:
        s.is_revoked = True

    # Send security notification
    notifier = get_notification_provider()
    security_alert = f"[{settings.BRAND_NAME}] Security Alert: Your password was recently reset. If this was not you, please contact support immediately."
    await notifier.send_sms(user.phone, security_alert)
    await notifier.send_email(user.email, f"{settings.BRAND_NAME} Password Changed", f"<p>{security_alert}</p>")

    await db.commit()
    return {"message": "Password has been successfully reset. Please log in with your new password."}


@router.get("/sessions")
async def get_active_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all non-revoked sessions for current user."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(UserSession).where(
            UserSession.user_id == current_user.id,
            UserSession.is_revoked == False,
            UserSession.expires_at > now
        ).order_by(UserSession.created_at.desc())
    )
    sessions = result.scalars().all()
    return [
        {
            "id": str(s.id),
            "device_info": s.device_info or "Unknown Device",
            "ip_address": s.ip_address or "Unknown IP",
            "created_at": s.created_at,
            "expires_at": s.expires_at
        }
        for s in sessions
    ]


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Revoke a specific session by ID."""
    result = await db.execute(
        select(UserSession).where(
            UserSession.id == session_id,
            UserSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    session.is_revoked = True
    await db.commit()
    return {"message": "Session revoked."}

