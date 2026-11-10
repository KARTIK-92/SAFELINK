from datetime import datetime
import uuid
from typing import List, Optional, Union
from pydantic import BaseModel, Field, ConfigDict
from app.models.incident import VolunteerIncidentStatus


class VolunteerAvailabilityToggle(BaseModel):
    is_available: bool
    reason: Optional[str] = None


class VolunteerLocationUpdate(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    accuracy_meters: float = Field(default=10.0, ge=0.0)
    speed: Optional[float] = None
    heading: Optional[float] = None


class VolunteerProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Union[str, uuid.UUID]
    user_id: Union[str, uuid.UUID]
    vehicle_type: str
    skills: List[str]
    is_available: bool
    total_incidents_responded: int
    last_seen_at: Optional[datetime] = None


class VolunteerIncidentSummary(BaseModel):
    incident_id: str
    status: str
    approximate_distance_meters: int
    started_at: datetime
    address_hint: Optional[str] = None


class VolunteerStatusUpdate(BaseModel):
    status: VolunteerIncidentStatus
