from datetime import date, datetime
import uuid
from typing import Optional, List, Union
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.user import UserRole, AccountStatus, VerificationStatus


class UserProfileSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    full_legal_name: str
    gender: str
    date_of_birth: date
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    pin_code: str
    profile_photo_url: Optional[str] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Union[str, uuid.UUID]
    phone: str
    email: str
    role: UserRole
    status: AccountStatus
    is_phone_verified: bool
    is_email_verified: bool
    created_at: datetime
    profile: Optional[UserProfileSchema] = None


class UpdateUserRequest(BaseModel):
    full_legal_name: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pin_code: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ChangePhoneRequest(BaseModel):
    new_phone: str
    otp_code: str


class ChangeEmailRequest(BaseModel):
    new_email: EmailStr
    otp_code: str


class AccountDeletionRequestSchema(BaseModel):
    password: str
    reason: Optional[str] = None
    confirmation: bool
