import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, Integer, Float, DateTime, ForeignKey, JSON, BigInteger
)
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import GUID, TimestampMixin


class VolunteerProfile(Base, TimestampMixin):
    __tablename__ = "volunteer_profiles"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    vehicle_type = Column(String(50), default="foot", nullable=False)  # foot, two_wheeler, four_wheeler
    skills = Column(JSON, default=list, nullable=False)  # ["first_aid", "cpr", "de_escalation"]
    police_verification_doc_path = Column(String(500), nullable=True)
    is_available = Column(Boolean, default=False, index=True, nullable=False)
    total_incidents_responded = Column(Integer, default=0, nullable=False)
    last_seen_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="volunteer_profile")
    locations = relationship("VolunteerLocation", back_populates="volunteer", cascade="all, delete-orphan")
    availability_logs = relationship("VolunteerAvailabilityLog", back_populates="volunteer", cascade="all, delete-orphan")
    incident_assignments = relationship("IncidentVolunteer", back_populates="volunteer", cascade="all, delete-orphan")


class VolunteerAvailabilityLog(Base):
    __tablename__ = "volunteer_availability_logs"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    volunteer_id = Column(GUID, ForeignKey("volunteer_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    is_available = Column(Boolean, nullable=False)
    toggled_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    reason = Column(String(255), nullable=True)

    volunteer = relationship("VolunteerProfile", back_populates="availability_logs")


class VolunteerLocation(Base):
    __tablename__ = "volunteer_locations"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    volunteer_id = Column(GUID, ForeignKey("volunteer_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy_meters = Column(Float, nullable=False, default=10.0)
    speed = Column(Float, nullable=True)
    heading = Column(Float, nullable=True)
    recorded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    volunteer = relationship("VolunteerProfile", back_populates="locations")
