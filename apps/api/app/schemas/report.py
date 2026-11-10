from datetime import datetime
import uuid
from typing import Optional, Union
from pydantic import BaseModel, Field, ConfigDict


class CreateReportRequest(BaseModel):
    reported_user_id: Union[str, uuid.UUID]
    incident_id: Optional[Union[str, uuid.UUID]] = None
    reason: str = Field(..., min_length=3, max_length=100)
    details: str = Field(..., min_length=10, max_length=2000)


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Union[str, uuid.UUID]
    reporter_id: Optional[Union[str, uuid.UUID]] = None
    reported_user_id: Union[str, uuid.UUID]
    incident_id: Optional[Union[str, uuid.UUID]] = None
    reason: str
    details: str
    status: str
    resolution_notes: Optional[str] = None
    created_at: datetime


class UpdateReportStatusRequest(BaseModel):
    status: str = Field(..., pattern="^(under_review|resolved|dismissed|action_taken)$")
    resolution_notes: Optional[str] = None
    suspend_reported_user: bool = False
