import secrets
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, Tuple

from app.core.config import settings
from app.core.security import generate_otp_code, hash_otp, verify_otp_hash


class OTPRecord:
    def __init__(self, otp_hash: str, salt: str, expires_at: datetime):
        self.otp_hash = otp_hash
        self.salt = salt
        self.expires_at = expires_at
        self.attempts_left = settings.OTP_MAX_ATTEMPTS
        self.last_sent_at = datetime.now(timezone.utc)


class OTPService:
    """Manages OTP generation, peppered HMAC storage, rate limiting, and verification."""
    def __init__(self):
        # In-memory store; easily backed by Redis in multi-instance production
        self._store: Dict[str, OTPRecord] = {}

    def _get_key(self, destination: str, purpose: str) -> str:
        return f"{purpose}:{destination.lower().strip()}"

    def can_send(self, destination: str, purpose: str) -> Tuple[bool, int]:
        """Check if destination is in cooldown. Returns (can_send, remaining_cooldown_seconds)."""
        key = self._get_key(destination, purpose)
        record = self._store.get(key)
        if not record:
            return True, 0
            
        now = datetime.now(timezone.utc)
        elapsed = (now - record.last_sent_at).total_seconds()
        if elapsed < settings.OTP_RESEND_COOLDOWN_SECONDS:
            return False, int(settings.OTP_RESEND_COOLDOWN_SECONDS - elapsed)
        return True, 0

    def generate_and_store(self, destination: str, purpose: str) -> Tuple[str, str]:
        """Generate OTP, hash it with a fresh salt, and store it.
        Returns: (otp_code, salt)
        """
        key = self._get_key(destination, purpose)
        otp_code = generate_otp_code(6)
        salt = secrets.token_hex(8)
        hashed = hash_otp(otp_code, salt)
        
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
        record = OTPRecord(otp_hash=hashed, salt=salt, expires_at=expires_at)
        self._store[key] = record
        
        return otp_code, salt

    def verify(self, destination: str, otp_code: str, purpose: str) -> Tuple[bool, str]:
        """Verify an OTP code against stored record.
        Enforces expiration and maximum 5 attempts.
        """
        key = self._get_key(destination, purpose)
        record = self._store.get(key)
        
        if not record:
            return False, "OTP has expired or was not requested."
            
        now = datetime.now(timezone.utc)
        if now > record.expires_at:
            del self._store[key]
            return False, "OTP has expired. Please request a new code."
            
        if record.attempts_left <= 0:
            del self._store[key]
            return False, "Maximum verification attempts exceeded. Please request a new code."
            
        # Verify hash
        is_valid = verify_otp_hash(otp_code, record.salt, record.otp_hash)
        if is_valid:
            # Consume OTP on success
            del self._store[key]
            return True, "Verification successful."
        else:
            record.attempts_left -= 1
            if record.attempts_left <= 0:
                del self._store[key]
                return False, "Invalid code. Maximum attempts reached."
            return False, f"Invalid code. {record.attempts_left} attempts remaining."


otp_service = OTPService()
