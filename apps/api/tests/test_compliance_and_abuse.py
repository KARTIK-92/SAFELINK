import pytest
from starlette.testclient import TestClient


def test_security_headers_enforcement(client: TestClient):
    """Verify ASGI middleware sets strict security headers on all responses."""
    res = client.get("/api/v1/health")
    assert res.status_code == 200

    headers = {k.lower(): v for k, v in res.headers.items()}
    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("x-frame-options") == "DENY"
    assert headers.get("x-xss-protection") == "1; mode=block"
    assert "strict-origin-when-cross-origin" in headers.get("referrer-policy", "")
    assert "max-age=" in headers.get("strict-transport-security", "")
    assert "default-src 'self'" in headers.get("content-security-policy", "")
    assert "geolocation=(self)" in headers.get("permissions-policy", "")


def test_dpdp_data_export_and_portability(client: TestClient):
    """DPDP Act Right to Access: Ensure machine-readable personal data export."""
    phone = "+919876500011"
    email = "dpdp.export@example.com"
    pwd = "SecurePassword123#"

    client.post("/api/v1/auth/register", json={
        "phone": phone,
        "email": email,
        "password": pwd,
        "role": "woman",
        "full_legal_name": "Ananya Roy",
        "gender": "female",
        "date_of_birth": "1996-03-15",
        "address_line1": "100 MG Road",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560001",
        "accepted_terms": True
    })

    login_res = client.post("/api/v1/auth/login", json={"identifier": phone, "password": pwd})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Add emergency contact
    client.post("/api/v1/contacts", json={
        "name": "Father",
        "relationship": "Parent",
        "phone": "+919876500099",
        "preferred_channels": ["sms"],
        "priority_order": 1
    }, headers=headers)

    # Request data export
    export_res = client.get("/api/v1/users/me/export", headers=headers)
    assert export_res.status_code == 200
    export_data = export_res.json()

    assert "export_metadata" in export_data
    assert "Digital Personal Data Protection Act" in export_data["export_metadata"]["compliance"]
    assert export_data["account"]["phone"] == phone
    assert export_data["account"]["email"] == email
    assert export_data["profile"]["full_legal_name"] == "Ananya Roy"
    assert len(export_data["emergency_contacts"]) == 1
    assert export_data["emergency_contacts"][0]["name"] == "Father"


def test_dpdp_account_deletion_and_pii_shredding(client: TestClient):
    """DPDP Act Right to Erasure: Permanent data purge and credential revocation."""
    phone = "+919876500022"
    email = "dpdp.delete@example.com"
    pwd = "SecurePassword123#"

    client.post("/api/v1/auth/register", json={
        "phone": phone,
        "email": email,
        "password": pwd,
        "role": "woman",
        "full_legal_name": "Meera Sen",
        "gender": "female",
        "date_of_birth": "1995-11-20",
        "address_line1": "42 Whitefield",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560066",
        "accepted_terms": True
    })

    login_res = client.post("/api/v1/auth/login", json={"identifier": phone, "password": pwd})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Attempt deletion with wrong password -> 401
    bad_res = client.request("DELETE", "/api/v1/users/me", json={
        "password": "WrongPassword!",
        "confirmation": True
    }, headers=headers)
    assert bad_res.status_code == 401

    # 2. Delete with correct confirmation
    del_res = client.request("DELETE", "/api/v1/users/me", json={
        "password": pwd,
        "confirmation": True,
        "reason": "Relocating out of country"
    }, headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "completed"

    # 3. Subsequent login must be rejected
    post_login = client.post("/api/v1/auth/login", json={"identifier": phone, "password": pwd})
    assert post_login.status_code in [401, 403]


def test_abuse_reporting_and_admin_suspension(client: TestClient):
    """Abuse moderation: User filing report against malicious actor, Admin suspending account."""
    # 1. Register reporter (Woman)
    reporter_phone = "+919876500033"
    pwd = "UserPassword123#"
    client.post("/api/v1/auth/register", json={
        "phone": reporter_phone,
        "email": "reporter@example.com",
        "password": pwd,
        "role": "woman",
        "full_legal_name": "Rani Mukherjee",
        "gender": "female",
        "date_of_birth": "1998-05-10",
        "address_line1": "12 Indiranagar",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560038",
        "accepted_terms": True
    })
    r_login = client.post("/api/v1/auth/login", json={"identifier": reporter_phone, "password": pwd})
    r_token = r_login.json()["access_token"]
    r_headers = {"Authorization": f"Bearer {r_token}"}

    # 2. Register abusive volunteer actor
    actor_phone = "+919876500044"
    client.post("/api/v1/auth/register", json={
        "phone": actor_phone,
        "email": "actor@example.com",
        "password": pwd,
        "role": "volunteer",
        "full_legal_name": "Suspicious Actor",
        "gender": "male",
        "date_of_birth": "1991-01-01",
        "address_line1": "88 Unknown St",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560001",
        "accepted_terms": True
    })
    actor_id = client.post("/api/v1/auth/login", json={"identifier": actor_phone, "password": pwd}).json()["user"]["id"]

    # 3. File Abuse Report
    report_res = client.post("/api/v1/reports", json={
        "reported_user_id": actor_id,
        "reason": "inappropriate_behavior",
        "details": "User exhibited unprofessional and aggressive conduct during response."
    }, headers=r_headers)
    assert report_res.status_code == 201
    report_id = report_res.json()["id"]

    # 4. Register and Login Admin
    admin_phone = "+919876500055"
    client.post("/api/v1/auth/register", json={
        "phone": admin_phone,
        "email": "admin@safelink.gov.in",
        "password": pwd,
        "role": "admin",
        "full_legal_name": "Security Administrator",
        "gender": "female",
        "date_of_birth": "1988-10-10",
        "address_line1": "SafeLink Operations Command",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560001",
        "accepted_terms": True
    })
    a_login = client.post("/api/v1/auth/login", json={"identifier": admin_phone, "password": pwd})
    a_token = a_login.json()["access_token"]
    a_headers = {"Authorization": f"Bearer {a_token}"}

    # 5. Admin lists reports
    reports_list = client.get("/api/v1/reports", headers=a_headers)
    assert reports_list.status_code == 200
    assert len(reports_list.json()) >= 1

    # 6. Admin resolves report and suspends malicious actor
    resolve_res = client.patch(f"/api/v1/reports/{report_id}", json={
        "status": "action_taken",
        "resolution_notes": "Confirmed inappropriate behavior. Account suspended indefinitely.",
        "suspend_reported_user": True
    }, headers=a_headers)
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "action_taken"

    # 7. Suspended actor can no longer log in
    actor_attempt = client.post("/api/v1/auth/login", json={"identifier": actor_phone, "password": pwd})
    assert actor_attempt.status_code == 403
