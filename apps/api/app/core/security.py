import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError

from app.core.config import settings

# Initialize Argon2id password hasher with recommended secure parameters
# time_cost=3, memory_cost=65536 (64 MB), parallelism=4
pwd_hasher = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16
)


def hash_password(password: str) -> str:
    """Hash a plaintext password using Argon2id."""
    return pwd_hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against an Argon2id hash."""
    if not hashed_password:
        return False
    try:
        return pwd_hasher.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def create_access_token(
    subject: Union[str, Any],
    role: str,
    status: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create short-lived JWT access token."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload: Dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "status": status,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access"
    }
    encoded_jwt = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, Any],
    session_id: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create long-lived rotating refresh token."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
    payload: Dict[str, Any] = {
        "sub": str(subject),
        "sid": session_id,
        "jti": secrets.token_hex(16),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "refresh"
    }
    encoded_jwt = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Safely decode and validate a JWT token."""
    try:
        decoded = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"verify_exp": True}
        )
        return decoded
    except (jwt.PyJWTError, Exception):
        return None


def generate_opaque_token(bytes_count: int = 32) -> str:
    """Generate a high-entropy 256-bit cryptographically secure URL-safe opaque token."""
    return secrets.token_urlsafe(bytes_count)


def hash_token(token: str) -> str:
    """Hash an opaque token with SHA-256 for safe database indexing."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_otp_code(length: int = 6) -> str:
    """Generate cryptographically pseudo-random N-digit numeric OTP."""
    digits = "0123456789"
    return "".join(secrets.choice(digits) for _ in range(length))


def hash_otp(otp_code: str, salt: str) -> str:
    """Compute HMAC-SHA256 of OTP code using server pepper and salt."""
    key = settings.OTP_PEPPER.encode("utf-8")
    message = f"{otp_code}:{salt}".encode("utf-8")
    return hmac.new(key, message, hashlib.sha256).hexdigest()


def verify_otp_hash(otp_code: str, salt: str, expected_hash: str) -> bool:
    """Constant-time verification of OTP hash to prevent timing attacks."""
    computed_hash = hash_otp(otp_code, salt)
    return hmac.compare_digest(computed_hash, expected_hash)
