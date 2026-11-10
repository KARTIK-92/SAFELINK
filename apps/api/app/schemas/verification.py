import uuid
from datetime import datetime, timezone
from typing import List, Optional, Union
from pydantic import BaseModel, Field, EmailStr
from app.models.user import VerificationStatus


class VerificationInitiateRequest(BaseModel):
    id_type: str = Field(default="aadhaar_or_dl", description="Type of document (e.g. aadhaar, driving_license, voter_id)")
    id_number_hint: Optional[str] = Field(default="XXXX-XXXX-1234", description="Last 4 digits or hint only, never raw full UID")


class VerificationInitiateResponse(BaseModel):
    session_id: str
    provider: str
    is_mock: bool
    instructions: str
    oauth_url: Optional[str] = None


class VerificationSubmitRequest(BaseModel):
    session_id: str
    document_ref: Optional[str] = None
    force_reject: Optional[bool] = False  # For testing rejection states in demo mode


class VerificationSubmitResponse(BaseModel):
    success: bool
    status: VerificationStatus
    is_mock: bool
    provider_reference: Optional[str] = None
    rejection_reason: Optional[str] = None
    verified_at: Optional[datetime] = None
    warning: Optional[str] = None


class LivenessChallengeResponse(BaseModel):
    session_id: str
    provider: str
    actions_required: List[str]
    is_mock: bool


class LivenessSubmitRequest(BaseModel):
    session_id: str
    frames_count: int = Field(default=3, ge=1, le=10)
    performed_action: str = "blink_twice"


class LivenessSubmitResponse(BaseModel):
    passed: bool
    confidence_score: int
    provider: str
    is_mock: bool
    warning: str


class SessionInfoResponse(BaseModel):
    id: Union[str, uuid.UUID]
    device_info: Optional[str]
    ip_address: Optional[str]
    created_at: datetime
    expires_at: datetime
    is_current: bool = False
