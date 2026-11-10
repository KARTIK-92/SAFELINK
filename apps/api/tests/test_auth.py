import pytest
from starlette.testclient import TestClient


def test_health_check(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["brand"] == "SafeLink"


def test_registration_age_restriction(client: TestClient):
    payload = {
        "phone": "+919876543210",
        "email": "minor@example.com",
        "password": "Password123#",
        "role": "woman",
        "full_legal_name": "Test Minor",
        "gender": "female",
        "date_of_birth": "2015-01-01",  # Under 18
        "address_line1": "Street 1",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560001",
        "accepted_terms": True
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "minimum age of 18" in response.json()["detail"]


def test_registration_success_and_login(client: TestClient):
    payload = {
        "phone": "+919876543211",
        "email": "priya.sharma@example.com",
        "password": "SecurePassword123#",
        "role": "woman",
        "full_legal_name": "Priya Sharma",
        "gender": "female",
        "date_of_birth": "1998-05-15",
        "address_line1": "123 Defense Colony",
        "city": "New Delhi",
        "state": "Delhi",
        "pin_code": "110024",
        "accepted_terms": True
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "pending"
    assert "user_id" in data

    # Attempt login with password
    login_payload = {
        "identifier": "+919876543211",
        "password": "SecurePassword123#"
    }
    login_res = client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data
    assert "refresh_token" in login_data
    assert login_data["user"]["role"] == "woman"

    # Test me endpoint with access token
    token = login_data["access_token"]
    me_res = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "priya.sharma@example.com"
    assert me_data["profile"]["full_legal_name"] == "Priya Sharma"


def test_otp_flow(client: TestClient):
    phone = "+919988776655"
    send_res = client.post("/api/v1/auth/otp/send", json={
        "destination": phone,
        "channel": "phone",
        "purpose": "registration_verification"
    })
    assert send_res.status_code == 200
    send_data = send_res.json()
    assert send_data["status"] == "success"
    otp = send_data["demo_otp"]
    assert otp is not None
    assert len(otp) == 6

    # Verify invalid OTP
    verify_bad = client.post("/api/v1/auth/otp/verify", json={
        "destination": phone,
        "otp_code": "000000",
        "purpose": "registration_verification"
    })
    assert verify_bad.status_code == 400

    # Verify correct OTP
    verify_good = client.post("/api/v1/auth/otp/verify", json={
        "destination": phone,
        "otp_code": otp,
        "purpose": "registration_verification"
    })
    assert verify_good.status_code == 200
    assert verify_good.json()["verified"] is True
