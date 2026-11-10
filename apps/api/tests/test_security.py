import pytest
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_token, generate_opaque_token, hash_token,
    generate_otp_code, hash_otp, verify_otp_hash
)


def test_argon2id_password_hashing():
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)
    assert hashed.startswith("$argon2id$")
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False
    assert verify_password("", hashed) is False


def test_jwt_access_token():
    token = create_access_token(
        subject="user-12345",
        role="woman",
        status="verified"
    )
    assert isinstance(token, str)
    decoded = decode_token(token)
    assert decoded is not None
    assert decoded["sub"] == "user-12345"
    assert decoded["role"] == "woman"
    assert decoded["status"] == "verified"
    assert decoded["type"] == "access"


def test_opaque_tracking_token():
    token1 = generate_opaque_token(32)
    token2 = generate_opaque_token(32)
    assert len(token1) >= 40
    assert token1 != token2
    
    hash1 = hash_token(token1)
    hash2 = hash_token(token2)
    assert len(hash1) == 64  # SHA-256 hex length
    assert hash1 != hash2


def test_otp_generation_and_hashing():
    otp = generate_otp_code(6)
    assert len(otp) == 6
    assert otp.isdigit()
    
    salt = "random_salt_123"
    hashed = hash_otp(otp, salt)
    assert verify_otp_hash(otp, salt, hashed) is True
    assert verify_otp_hash("000000", salt, hashed) is False
