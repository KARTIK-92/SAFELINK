from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.incident import IncidentStatus, VolunteerIncidentStatus


class SOSStartRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    accuracy_meters: float = Field(default=10.0, ge=0.0)
    address_hint: Optional[str] = None


class SOSStartResponse(BaseModel):
    incident_id: str
    status: IncidentStatus
    started_at: datetime
    tracking_token: str
    tracking_url: str
    contacts_notified_count: int
    volunteers_notified_count: int
    expires_at: datetime


class SOSLocationUpdateRequest(BaseModel):
    incident_id: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    accuracy_meters: float = Field(default=10.0, ge=0.0)
    battery_level: Optional[float] = Field(None, ge=0.0, le=1.0)


class SOSCancelRequest(BaseModel):
    incident_id: str
    reason: Optional[str] = "False alarm / Safe now"


class SOSStatusResponse(BaseModel):
    incident_id: str
    status: IncidentStatus
    started_at: datetime
    active_responders_count: int
    contacts_notified_count: int
    latest_latitude: float
    latest_longitude: float
    latest_accuracy: float


class ResponderPublicInfo(BaseModel):
    responder_id: str
    status: VolunteerIncidentStatus
    responded_at: Optional[datetime] = None
    arrived_at: Optional[datetime] = None


class LiveTrackingPublicResponse(BaseModel):
    active: bool
    incident_id: Optional[str] = None
    woman_name_initial: Optional[str] = None
    last_latitude: Optional[float] = None
    last_longitude: Optional[float] = None
    accuracy_meters: Optional[float] = None
    updated_at: Optional[datetime] = None
    message: Optional[str] = None
    active_responders_count: int = 0
