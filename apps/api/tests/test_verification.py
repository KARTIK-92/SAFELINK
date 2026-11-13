import pytest
from starlette.testclient import TestClient


def test_verification_flow(client: TestClient):
    # Register and login a user
    reg_payload = {
        "phone": "+919111222333",
        "email": "verification.test@example.com",
        "password": "SecurePassword123#",
        "role": "woman",
        "full_legal_name": "Kavita Rao",
        "gender": "female",
        "date_of_birth": "1995-08-20",
        "address_line1": "45 Park Avenue",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560002",
        "accepted_terms": True
    }
    client.post("/api/v1/auth/register", json=reg_payload)
    
    login_res = client.post("/api/v1/auth/login", json={
        "identifier": "+919111222333",
        "password": "SecurePassword123#"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Initiate identity verification
    init_res = client.post(
        "/api/v1/verification/initiate",
        json={"id_type": "aadhaar", "id_number_hint": "9876"},
        headers=headers
    )
    assert init_res.status_code == 200
    init_data = init_res.json()
    assert "session_id" in init_data

    # 2. Submit successful verification
    session_id = init_data["session_id"]
    sub_res = client.post(
        "/api/v1/verification/submit",
        json={"session_id": session_id, "force_reject": False},
        headers=headers
    )
    assert sub_res.status_code == 200
    sub_data = sub_res.json()
    assert sub_data["success"] is True
    assert sub_data["status"] == "verified"

    # 3. Test Liveness Challenge
    chal_res = client.post("/api/v1/verification/liveness/challenge", headers=headers)
    assert chal_res.status_code == 200
    chal_data = chal_res.json()
    assert "actions_required" in chal_data

    # 4. Verify Liveness
    live_res = client.post(
        "/api/v1/verification/liveness/verify",
        json={
            "session_id": chal_data["session_id"],
            "frames_count": 3,
            "performed_action": "blink_twice"
        },
        headers=headers
    )
    assert live_res.status_code == 200
    live_data = live_res.json()
    assert live_data["passed"] is True
    assert live_data["confidence_score"] >= 90
