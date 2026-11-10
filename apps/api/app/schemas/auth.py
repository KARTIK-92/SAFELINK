from datetime import date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.models.user import UserRole, AccountStatus


class RegisterRequest(BaseModel):
    phone: str = Field(..., pattern=r"^\+?[1-9]\d{7,14}$", description="E.164 formatted phone number")
    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    role: UserRole = Field(default=UserRole.WOMAN)
    
    full_legal_name: str = Field(..., min_length=2, max_length=255)
    gender: str = Field(..., description="female, male, other")
    date_of_birth: date
    
    address_line1: str = Field(..., min_length=3)
    address_line2: Optional[str] = None
    city: str = Field(..., min_length=2)
    state: str = Field(..., min_length=2)
    pin_code: str = Field(..., min_length=4, max_length=10)
    
    accepted_terms: bool = Field(..., description="Must explicitly accept terms & privacy policy")

    @field_validator("accepted_terms")
    @classmethod
    def validate_terms(cls, v: bool) -> bool:
        if not v:
            raise ValueError("You must accept the terms of service and privacy policy to register.")
        return v


class RegisterResponse(BaseModel):
    user_id: str
    status: AccountStatus
    phone_verification_required: bool = True
    email_verification_required: bool = True
    message: str


class OTPSendRequest(BaseModel):
    destination: str = Field(..., description="Phone number or email address")
    channel: str = Field("phone", pattern=r"^(phone|email)$")
    purpose: str = Field("registration_verification", pattern=r"^(registration_verification|login|password_reset|contact_change)$")


class OTPSendResponse(BaseModel):
    status: str = "success"
    message: str = "If this contact is registered, a 6-digit code has been dispatched."
    expires_in_seconds: int = 300
    resend_cooldown_seconds: int = 60
    demo_otp: Optional[str] = None  # Only populated in mock/dev mode for automated testing!


class OTPVerifyRequest(BaseModel):
    destination: str
    otp_code: str = Field(..., min_length=6, max_length=6)
    purpose: str = "registration_verification"


class OTPVerifyResponse(BaseModel):
    verified: bool
    message: str


class LoginRequest(BaseModel):
    identifier: str = Field(..., description="Phone or Email")
    password: Optional[str] = None
    otp_code: Optional[str] = None
    device_info: Optional[str] = "Web Browser"


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class PasswordResetRequest(BaseModel):
    destination: str
    channel: str = "phone"


class PasswordResetConfirmRequest(BaseModel):
    destination: str
    otp_code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)
