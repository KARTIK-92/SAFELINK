import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, Integer, Float, DateTime, ForeignKey, Enum as SQLEnum, Text, BigInteger
)
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import GUID, TimestampMixin


class IncidentStatus(str, enum.Enum):
    ACTIVE = "active"
    RESOLVED = "resolved"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class VolunteerIncidentStatus(str, enum.Enum):
    ALERT_RECEIVED = "alert_received"
    ACCEPTED = "accepted"
    ON_THE_WAY = "on_the_way"
    REACHED_LOCATION = "reached_location"
    ASSISTANCE_COMPLETED = "assistance_completed"
    UNABLE_TO_ASSIST = "unable_to_assist"
    CANCELLED = "cancelled"


class EmergencyIncident(Base, TimestampMixin):
    __tablename__ = "emergency_incidents"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    woman_id = Column(GUID, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    status = Column(SQLEnum(IncidentStatus), default=IncidentStatus.ACTIVE, nullable=False, index=True)
    
    start_latitude = Column(Float, nullable=False)
    start_longitude = Column(Float, nullable=False)
    start_accuracy = Column(Float, nullable=False, default=10.0)
    address_snapshot = Column(Text, nullable=True)
    
    tracking_token_hash = Column(String(64), unique=True, index=True, nullable=False)
    cancellation_reason = Column(Text, nullable=True)
    search_radius_meters = Column(Integer, default=1000, nullable=False)
    
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    woman = relationship("User", back_populates="incidents", foreign_keys=[woman_id])
    responders = relationship("IncidentVolunteer", back_populates="incident", cascade="all, delete-orphan")
    location_updates = relationship("IncidentLocationUpdate", back_populates="incident", cascade="all, delete-orphan")
    access_tokens = relationship("LocationAccessToken", back_populates="incident", cascade="all, delete-orphan")
    notifications = relationship("NotificationLog", back_populates="incident", cascade="all, delete-orphan")


class IncidentVolunteer(Base):
    __tablename__ = "incident_volunteers"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    incident_id = Column(GUID, ForeignKey("emergency_incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    volunteer_id = Column(GUID, ForeignKey("volunteer_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    
    status = Column(SQLEnum(VolunteerIncidentStatus), default=VolunteerIncidentStatus.ALERT_RECEIVED, nullable=False)
    initial_distance_meters = Column(Integer, nullable=False, default=0)
    
    notified_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    responded_at = Column(DateTime(timezone=True), nullable=True)
    arrived_at = Column(DateTime(timezone=True), nullable=True)

    incident = relationship("EmergencyIncident", back_populates="responders")
    volunteer = relationship("VolunteerProfile", back_populates="incident_assignments")


class IncidentLocationUpdate(Base):
    __tablename__ = "incident_location_updates"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    incident_id = Column(GUID, ForeignKey("emergency_incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy_meters = Column(Float, nullable=False, default=10.0)
    battery_level = Column(Float, nullable=True)
    recorded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    incident = relationship("EmergencyIncident", back_populates="location_updates")


class LocationAccessToken(Base):
    __tablename__ = "location_access_tokens"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    token_hash = Column(String(64), unique=True, index=True, nullable=False)
    incident_id = Column(GUID, ForeignKey("emergency_incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_type = Column(String(50), nullable=False)  # contact, volunteer, emergency_service
    recipient_ref = Column(String(255), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    incident = relationship("EmergencyIncident", back_populates="access_tokens")


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    incident_id = Column(GUID, ForeignKey("emergency_incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    channel = Column(String(20), nullable=False)  # sms, whatsapp, email, fcm
    recipient = Column(String(255), nullable=False)
    status = Column(String(30), default="pending", nullable=False)  # pending, sent, delivered, failed
    provider_name = Column(String(50), nullable=False)
    provider_message_id = Column(String(255), nullable=True)
    error_message = Column(Text, nullable=True)
    dispatched_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    incident = relationship("EmergencyIncident", back_populates="notifications")
