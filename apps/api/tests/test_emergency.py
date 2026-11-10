import pytest
from starlette.testclient import TestClient


def test_emergency_lifecycle_complete(client: TestClient):
    # 1. Register and login a woman account
    woman_phone = "+919888800001"
    woman_pwd = "WomanPassword123#"
    reg_woman = {
        "phone": woman_phone,
        "email": "priya.sos@example.com",
        "password": woman_pwd,
        "role": "woman",
        "full_legal_name": "Priya Sharma",
        "gender": "female",
        "date_of_birth": "1997-04-12",
        "address_line1": "Flat 402, Lotus Apts",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560001",
        "accepted_terms": True
    }
    client.post("/api/v1/auth/register", json=reg_woman)
    login_res = client.post("/api/v1/auth/login", json={"identifier": woman_phone, "password": woman_pwd})
    assert login_res.status_code == 200
    woman_token = login_res.json()["access_token"]
    woman_headers = {"Authorization": f"Bearer {woman_token}"}

    # Verify woman account
    w_init = client.post("/api/v1/verification/initiate", json={"id_type": "aadhaar", "id_number_hint": "1234"}, headers=woman_headers)
    client.post("/api/v1/verification/submit", json={"session_id": w_init.json()["session_id"], "force_reject": False}, headers=woman_headers)

    # Add an emergency contact for Priya
    client.post("/api/v1/contacts", json={
        "name": "Kavita Sharma",
        "relationship": "Mother",
        "phone": "+919888800099",
        "preferred_channels": ["sms", "whatsapp"],
        "priority_order": 1
    }, headers=woman_headers)

    # 2. Register, login, and verify a nearby Volunteer
    vol_phone = "+919888800002"
    vol_pwd = "VolPassword123#"
    reg_vol = {
        "phone": vol_phone,
        "email": "rajesh.vol@example.com",
        "password": vol_pwd,
        "role": "volunteer",
        "full_legal_name": "Rajesh Nair",
        "gender": "male",
        "date_of_birth": "1992-08-20",
        "address_line1": "7 Brigade Road",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560001",
        "accepted_terms": True
    }
    client.post("/api/v1/auth/register", json=reg_vol)
    vol_login = client.post("/api/v1/auth/login", json={"identifier": vol_phone, "password": vol_pwd})
    assert vol_login.status_code == 200
    vol_token = vol_login.json()["access_token"]
    vol_headers = {"Authorization": f"Bearer {vol_token}"}

    # Complete verification for volunteer (mandatory to receive emergency dispatches)
    v_init = client.post("/api/v1/verification/initiate", json={"id_type": "aadhaar", "id_number_hint": "9876"}, headers=vol_headers)
    v_sub = client.post("/api/v1/verification/submit", json={"session_id": v_init.json()["session_id"], "force_reject": False}, headers=vol_headers)
    assert v_sub.json()["status"] == "verified"

    # Make volunteer available and update location
    avail_res = client.post("/api/v1/volunteer/availability", json={"is_available": True}, headers=vol_headers)
    assert avail_res.status_code == 200

    # Woman starts at: 12.9716, 77.5946 (MG Road Bengaluru)
    # Volunteer at: 12.9730, 77.5950 (approx 200 meters away)
    loc_res = client.post("/api/v1/volunteer/location", json={
        "latitude": 12.9730,
        "longitude": 77.5950,
        "accuracy_meters": 10.0
    }, headers=vol_headers)
    assert loc_res.status_code == 200

    # 3. Woman starts Emergency SOS
    start_payload = {
        "latitude": 12.9716,
        "longitude": 77.5946,
        "accuracy_meters": 12.5,
        "address_hint": "Near MG Road Metro Station"
    }
    sos_res = client.post("/api/v1/sos/start", json=start_payload, headers=woman_headers)
    assert sos_res.status_code == 201
    sos_data = sos_res.json()
    incident_id = sos_data["incident_id"]
    tracking_token = sos_data["tracking_token"]
    assert sos_data["status"] == "active"
    assert sos_data["contacts_notified_count"] == 1
    assert sos_data["volunteers_notified_count"] >= 1

    # 4. Concurrency check: duplicate SOS trigger for same active woman must be rejected with 409
    dup_res = client.post("/api/v1/sos/start", json=start_payload, headers=woman_headers)
    assert dup_res.status_code == 409

    # 5. Volunteer discovers nearby emergency incident
    inbox_res = client.get("/api/v1/volunteer/incidents", headers=vol_headers)
    assert inbox_res.status_code == 200
    incident_list = inbox_res.json()
    assert len(incident_list) >= 1
    assert incident_list[0]["incident_id"] == incident_id
    assert incident_list[0]["status"] == "alert_received"

    # Before accepting, volunteer cannot access precise details (Strict Privacy Rule)
    premature_details = client.get(f"/api/v1/volunteer/incidents/{incident_id}/details", headers=vol_headers)
    assert premature_details.status_code == 403

    # 6. Volunteer accepts incident
    accept_res = client.post(f"/api/v1/volunteer/incidents/{incident_id}/accept", headers=vol_headers)
    assert accept_res.status_code == 200
    assert accept_res.json()["volunteer_status"] == "accepted"

    # Now volunteer can view precise navigation details
    details_res = client.get(f"/api/v1/volunteer/incidents/{incident_id}/details", headers=vol_headers)
    assert details_res.status_code == 200
    assert details_res.json()["latitude"] == 12.9716
    assert details_res.json()["victim_display_name"] == "Priya S."

    # Volunteer updates status to reached_location
    patch_res = client.patch(
        f"/api/v1/volunteer/incidents/{incident_id}/status",
        json={"status": "reached_location"},
        headers=vol_headers
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["volunteer_status"] == "reached_location"

    # 7. Woman updates continuous location breadcrumbs
    loc_update_res = client.post("/api/v1/sos/location", json={
        "incident_id": incident_id,
        "latitude": 12.9719,
        "longitude": 77.5949,
        "accuracy_meters": 8.0,
        "battery_level": 0.85
    }, headers=woman_headers)
    assert loc_update_res.status_code == 200

    # Check status from woman's perspective
    status_res = client.get(f"/api/v1/sos/{incident_id}/status", headers=woman_headers)
    assert status_res.status_code == 200
    assert status_res.json()["latest_latitude"] == 12.9719
    assert status_res.json()["active_responders_count"] == 1

    # 8. Public live tracking by Emergency Contact using ephemeral token
    track_res = client.get(f"/api/v1/tracking/{tracking_token}")
    assert track_res.status_code == 200
    track_data = track_res.json()
    assert track_data["active"] is True
    assert track_data["woman_name_initial"] == "Priya S."
    assert track_data["last_latitude"] == 12.9719
    assert track_data["active_responders_count"] == 1
    assert "noindex" in track_res.headers.get("x-robots-tag", "")

    # 9. Distressed woman cancels emergency
    cancel_res = client.post("/api/v1/sos/cancel", json={
        "incident_id": incident_id,
        "reason": "Family arrived, safe now"
    }, headers=woman_headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

    # 10. Post-cancellation security checks:
    # Ephemeral tracking page now reports inactive and exposes ZERO coordinates
    post_track_res = client.get(f"/api/v1/tracking/{tracking_token}")
    assert post_track_res.status_code == 200
    post_track_data = post_track_res.json()
    assert post_track_data["active"] is False
    assert post_track_data["last_latitude"] is None

    # Subsequent location breadcrumbs are rejected
    rejected_loc = client.post("/api/v1/sos/location", json={
        "incident_id": incident_id,
        "latitude": 12.9725,
        "longitude": 77.5955,
        "accuracy_meters": 5.0
    }, headers=woman_headers)
    assert rejected_loc.status_code == 400
