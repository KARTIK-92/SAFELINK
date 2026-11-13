import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime, Date, ForeignKey, Enum as SQLEnum, Text, JSON
)
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import GUID, TimestampMixin


class UserRole(str, enum.Enum):
    WOMAN = "woman"
    VOLUNTEER = "volunteer"
    ADMIN = "admin"


class AccountStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    SUSPENDED = "suspended"
    UNDER_REVIEW = "under_review"


class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    UNDER_REVIEW = "under_review"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.WOMAN)
    status = Column(SQLEnum(AccountStatus), nullable=False, default=AccountStatus.PENDING)
    
    is_active = Column(Boolean, default=True, nullable=False)
    is_phone_verified = Column(Boolean, default=False, nullable=False)
    is_email_verified = Column(Boolean, default=False, nullable=False)
    
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    volunteer_profile = relationship("VolunteerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    emergency_contacts = relationship("EmergencyContact", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    device_tokens = relationship("DeviceToken", back_populates="user", cascade="all, delete-orphan")
    identity_verifications = relationship("IdentityVerification", back_populates="user", cascade="all, delete-orphan")
    liveness_verifications = relationship("LivenessVerification", back_populates="user", cascade="all, delete-orphan")
    incidents = relationship("EmergencyIncident", back_populates="woman", foreign_keys="EmergencyIncident.woman_id")


class UserProfile(Base, TimestampMixin):
    __tablename__ = "user_profiles"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    full_legal_name = Column(String(255), nullable=False)
    gender = Column(String(50), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    
    address_line1 = Column(String(255), nullable=False)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pin_code = Column(String(10), nullable=False)
    
    profile_photo_path = Column(String(500), nullable=True)  # Private storage key
    
    user = relationship("User", back_populates="profile")


class IdentityVerification(Base, TimestampMixin):
    __tablename__ = "identity_verifications"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    provider = Column(String(50), default="digilocker", nullable=False)  # digilocker, kyc_docs, authorized_kyc
    status = Column(SQLEnum(VerificationStatus), default=VerificationStatus.PENDING, nullable=False)
    provider_reference = Column(String(255), nullable=True)
    verification_payload_hash = Column(String(64), nullable=True)  # SHA-256 hash of result
    rejection_reason = Column(Text, nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    
    user = relationship("User", back_populates="identity_verifications")


class LivenessVerification(Base, TimestampMixin):
    __tablename__ = "liveness_verifications"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    provider = Column(String(50), default="biometric", nullable=False)
    passed = Column(Boolean, default=False, nullable=False)
    confidence_score = Column(Integer, default=0, nullable=False)  # 0 to 100
    session_data = Column(JSON, nullable=True)
    
    user = relationship("User", back_populates="liveness_verifications")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    refresh_token_hash = Column(String(64), unique=True, index=True, nullable=False)
    device_info = Column(String(255), nullable=True)
    ip_address = Column(String(45), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="sessions")


class DeviceToken(Base, TimestampMixin):
    __tablename__ = "device_tokens"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    fcm_token = Column(String(500), unique=True, index=True, nullable=False)
    device_platform = Column(String(20), default="android", nullable=False)  # android, ios, web
    is_active = Column(Boolean, default=True, nullable=False)

    user = relationship("User", back_populates="device_tokens")
