import pytest
from starlette.testclient import TestClient


def test_password_reset_and_session_management(client: TestClient):
    phone = "+919444555666"
    email = "session.test@example.com"
    old_password = "InitialPassword123#"
    new_password = "BrandNewPassword456#"

    # 1. Register user
    reg_payload = {
        "phone": phone,
        "email": email,
        "password": old_password,
        "role": "woman",
        "full_legal_name": "Meera Patel",
        "gender": "female",
        "date_of_birth": "1997-03-12",
        "address_line1": "78 MG Road",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "pin_code": "380001",
        "accepted_terms": True
    }
    client.post("/api/v1/auth/register", json=reg_payload)

    # 2. Login to obtain session
    login_res = client.post("/api/v1/auth/login", json={
        "identifier": phone,
        "password": old_password
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. List active sessions
    sess_res = client.get("/api/v1/auth/sessions", headers=headers)
    assert sess_res.status_code == 200
    sessions = sess_res.json()
    assert len(sessions) >= 1
    session_id = sessions[0]["id"]

    # 4. Request password reset OTP
    reset_req = client.post(
        "/api/v1/auth/password/reset-request",
        json={"destination": phone, "channel": "phone"}
    )
    assert reset_req.status_code == 200
    otp = reset_req.json()["demo_otp"]
    assert otp is not None

    # 5. Confirm password reset
    reset_conf = client.post(
        "/api/v1/auth/password/reset-confirm",
        json={
            "destination": phone,
            "otp_code": otp,
            "new_password": new_password
        }
    )
    assert reset_conf.status_code == 200
    assert "successfully reset" in reset_conf.json()["message"]

    # 6. Verify old password no longer works
    bad_login = client.post("/api/v1/auth/login", json={
        "identifier": phone,
        "password": old_password
    })
    assert bad_login.status_code == 401

    # 7. Verify new password works
    good_login = client.post("/api/v1/auth/login", json={
        "identifier": phone,
        "password": new_password
    })
    assert good_login.status_code == 200
    assert "access_token" in good_login.json()
