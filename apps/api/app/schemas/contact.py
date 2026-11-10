from datetime import datetime
import uuid
from typing import List, Optional, Union
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict


class EmergencyContactCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    relationship: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., pattern=r"^\+?[1-9]\d{7,14}$")
    email: Optional[EmailStr] = None
    preferred_channels: List[str] = Field(default=["sms", "whatsapp"])
    priority_order: int = Field(default=1, ge=1, le=3)

    @field_validator("preferred_channels")
    @classmethod
    def validate_channels(cls, channels: List[str]) -> List[str]:
        allowed = {"sms", "whatsapp", "email"}
        for ch in channels:
            if ch not in allowed:
                raise ValueError(f"Channel '{ch}' is not supported. Allowed: {allowed}")
        if not channels:
            raise ValueError("At least one preferred notification channel must be selected.")
        return channels


class EmergencyContactUpdate(BaseModel):
    name: Optional[str] = None
    relationship: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    preferred_channels: Optional[List[str]] = None
    priority_order: Optional[int] = None
    is_active: Optional[bool] = None


class EmergencyContactResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Union[str, uuid.UUID]
    name: str
    relationship: str
    phone: str
    email: Optional[str] = None
    preferred_channels: List[str]
    priority_order: int
    is_active: bool
    created_at: datetime
