import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Text, BigInteger, Integer
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import GUID, TimestampMixin


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    user_id = Column(GUID, nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(255), nullable=True)
    metadata_json = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)


class AbuseReport(Base, TimestampMixin):
    __tablename__ = "abuse_reports"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    reporter_id = Column(GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reported_user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    incident_id = Column(GUID, ForeignKey("emergency_incidents.id", ondelete="SET NULL"), nullable=True)
    
    reason = Column(String(100), nullable=False)  # inappropriate_behavior, fake_alert, harassment
    details = Column(Text, nullable=False)
    status = Column(String(30), default="under_review", nullable=False)  # under_review, resolved, dismissed
    resolution_notes = Column(Text, nullable=True)


class AccountDeletionRequest(Base):
    __tablename__ = "account_deletion_requests"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(30), default="scheduled", nullable=False)  # scheduled, processing, completed, cancelled
    scheduled_deletion_at = Column(DateTime(timezone=True), nullable=False)
    requested_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String(100), primary_key=True)
    value_json = Column(JSON, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
