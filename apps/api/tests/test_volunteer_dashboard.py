import pytest
from starlette.testclient import TestClient


def test_volunteer_availability_and_location(client: TestClient):
    phone = "+919555666777"
    pwd = "VolunteerPass123#"
    reg_payload = {
        "phone": phone,
        "email": "volunteer.ops@example.com",
        "password": pwd,
        "role": "volunteer",
        "full_legal_name": "Arjun Nair",
        "gender": "male",
        "date_of_birth": "1993-11-04",
        "address_line1": "99 Brigade Road",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560001",
        "accepted_terms": True
    }
    client.post("/api/v1/auth/register", json=reg_payload)

    login_res = client.post("/api/v1/auth/login", json={"identifier": phone, "password": pwd})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch volunteer profile
    vol_res = client.get("/api/v1/volunteer/me", headers=headers)
    assert vol_res.status_code == 200
    assert vol_res.json()["is_available"] is False

    # 2. Update location while OFFLINE -> MUST BE REJECTED to preserve privacy
    loc_offline = client.post("/api/v1/volunteer/location", json={
        "latitude": 12.9716,
        "longitude": 77.5946,
        "accuracy_meters": 10.0
    }, headers=headers)
    assert loc_offline.status_code == 400
    assert "UNAVAILABLE" in loc_offline.json()["detail"]

    # 3. Toggle availability to AVAILABLE
    avail_res = client.post("/api/v1/volunteer/availability", json={
        "is_available": True,
        "reason": "On duty shift"
    }, headers=headers)
    assert avail_res.status_code == 200
    assert avail_res.json()["is_available"] is True

    # 4. Update location while AVAILABLE -> MUST SUCCEED
    loc_online = client.post("/api/v1/volunteer/location", json={
        "latitude": 12.9716,
        "longitude": 77.5946,
        "accuracy_meters": 8.0,
        "speed": 1.2,
        "heading": 180.0
    }, headers=headers)
    assert loc_online.status_code == 200
    assert loc_online.json()["status"] == "success"
