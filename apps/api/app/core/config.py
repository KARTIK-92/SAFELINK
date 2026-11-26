from typing import List, Optional
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # General
    ENVIRONMENT: str = "development"
    TESTING: bool = False
    APP_NAME: str = "SafeLink"
    BRAND_NAME: str = "SafeLink"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    
    # Cryptographic & Auth
    SECRET_KEY: str = "temporary-dev-secret-key-change-in-production-safelink-2026-xyz"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    PASSWORD_MIN_LENGTH: int = 8

    # Eligibility & Emergency Constants
    MINIMUM_REGISTRATION_AGE: int = 18
    MAX_EMERGENCY_CONTACTS: int = 3
    DEFAULT_SEARCH_RADIUS_METERS: int = 1000
    EXPANDED_SEARCH_RADIUS_METERS: int = 2000
    MAX_SEARCH_RADIUS_METERS: int = 3000
    MAX_VOLUNTEER_NOTIFICATIONS_INITIAL: int = 15
    MAX_ASSIGNED_RESPONDERS: int = 3
    VOLUNTEER_LOCATION_STALE_MINUTES: int = 5
    INCIDENT_EXPIRATION_HOURS: int = 6

    # URLs
    FRONTEND_URL: str = "http://localhost:3000"
    API_BASE_URL: str = "http://localhost:8000"
    EMERGENCY_TRACKING_BASE_URL: str = "http://localhost:3000/t"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./safelink_dev.db"
    DATABASE_URL_SYNC: str = "sqlite:///./safelink_dev.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Storage
    STORAGE_PROVIDER: str = "local"  # local, minio, s3
    S3_ENDPOINT_URL: Optional[str] = "http://localhost:9000"
    S3_ACCESS_KEY: Optional[str] = "minioadmin"
    S3_SECRET_KEY: Optional[str] = "minioadmin"
    S3_BUCKET_NAME: str = "safelink-verification-private"
    S3_REGION: str = "us-east-1"
    LOCAL_STORAGE_DIR: str = "./local_storage/kyc"

    # Providers Configuration
    VERIFICATION_PROVIDER: str = "digilocker"  # digilocker, kyc_docs, mock
    LIVENESS_PROVIDER: str = "biometric"       # biometric, mock
    SMS_PROVIDER: str = "production"           # production (twilio/fast2sms/meta), mock
    WHATSAPP_PROVIDER: str = "production"      # production, mock
    EMAIL_PROVIDER: str = "production"         # production (resend/smtp), mock

    # External APIs (100% Free Tiers Supported)
    # Email: Resend Free Tier (3,000 emails/month free forever)
    RESEND_API_KEY: Optional[str] = None
    EMAIL_FROM: str = "SafeLink Alerts <onboarding@resend.dev>"

    # Email: Alternative SMTP (e.g. Brevo 300/day free or Gmail App Password)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    # SMS: Twilio / Fast2SMS
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    FAST2SMS_API_KEY: Optional[str] = None

    # Push Notifications: Firebase Cloud Messaging (FCM - 100% Free Forever)
    FCM_SERVER_KEY: Optional[str] = None
    FCM_SERVICE_ACCOUNT_JSON: Optional[str] = None

    # Government ID: DigiLocker Sandbox API (Free official government gateway)
    DIGILOCKER_CLIENT_ID: Optional[str] = None
    DIGILOCKER_CLIENT_SECRET: Optional[str] = None

    # OTP Controls
    OTP_EXPIRY_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 5
    OTP_RESEND_COOLDOWN_SECONDS: int = 60
    OTP_PEPPER: str = "safelink-otp-pepper-secret-random-salt"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    def resolve_tracking_base_url(self, request_base_url: Optional[str] = None) -> str:
        """Resolve public HTTPS live-tracking base URL, never returning localhost when a public host exists."""
        def _is_local(url: Optional[str]) -> bool:
            if not url:
                return True
            lower = url.lower()
            return "localhost" in lower or "127.0.0.1" in lower or "0.0.0.0" in lower

        if not _is_local(self.EMERGENCY_TRACKING_BASE_URL):
            return self.EMERGENCY_TRACKING_BASE_URL.rstrip("/")
        if not _is_local(self.FRONTEND_URL):
            return f"{self.FRONTEND_URL.rstrip('/')}/t"
        if not _is_local(self.API_BASE_URL):
            return f"{self.API_BASE_URL.rstrip('/')}/t"
        if request_base_url and not _is_local(request_base_url):
            clean = request_base_url.rstrip("/")
            if clean.startswith("http://") and "onrender.com" in clean:
                clean = "https://" + clean[len("http://"):]
            return f"{clean}/t"
        return "https://safelink-api-zuiu.onrender.com/t"


settings = Settings()
