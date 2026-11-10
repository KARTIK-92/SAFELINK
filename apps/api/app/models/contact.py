import uuid
from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship as orm_relationship

from app.core.database import Base
from app.models.base import GUID, TimestampMixin


class EmergencyContact(Base, TimestampMixin):
    __tablename__ = "emergency_contacts"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = Column(String(255), nullable=False)
    relationship = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(255), nullable=True)
    
    # Store list of preferred notification channels: ["sms", "whatsapp", "email"]
    preferred_channels = Column(JSON, default=lambda: ["sms", "whatsapp"], nullable=False)
    priority_order = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    user = orm_relationship("User", back_populates="emergency_contacts")
