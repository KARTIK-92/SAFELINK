import pytest
from starlette.testclient import TestClient


def test_emergency_contacts_lifecycle_and_max_limit(client: TestClient):
    # Register and login a woman account
    phone = "+919777888999"
    email = "contacts.test@example.com"
    pwd = "SecurePassword123#"
    reg_payload = {
        "phone": phone,
        "email": email,
        "password": pwd,
        "role": "woman",
        "full_legal_name": "Sunita Verma",
        "gender": "female",
        "date_of_birth": "1994-06-18",
        "address_line1": "12 Residency Road",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560025",
        "accepted_terms": True
    }
    client.post("/api/v1/auth/register", json=reg_payload)

    login_res = client.post("/api/v1/auth/login", json={"identifier": phone, "password": pwd})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Initially 0 contacts
    get_res = client.get("/api/v1/contacts", headers=headers)
    assert get_res.status_code == 200
    assert len(get_res.json()) == 0

    # 2. Add Contact 1 (Mother)
    c1_res = client.post("/api/v1/contacts", json={
        "name": "Geeta Verma",
        "relationship": "Mother",
        "phone": "+919111111111",
        "email": "geeta@example.com",
        "preferred_channels": ["sms", "whatsapp"],
        "priority_order": 1
    }, headers=headers)
    assert c1_res.status_code == 201
    c1_id = c1_res.json()["id"]

    # 3. Add Contact 2 (Sister)
    c2_res = client.post("/api/v1/contacts", json={
        "name": "Pooja Verma",
        "relationship": "Sister",
        "phone": "+919222222222",
        "email": "pooja@example.com",
        "preferred_channels": ["sms", "whatsapp", "email"],
        "priority_order": 2
    }, headers=headers)
    assert c2_res.status_code == 201

    # 4. Add Contact 3 (Friend)
    c3_res = client.post("/api/v1/contacts", json={
        "name": "Ananya Sen",
        "relationship": "Friend",
        "phone": "+919333333333",
        "email": "ananya@example.com",
        "preferred_channels": ["whatsapp"],
        "priority_order": 3
    }, headers=headers)
    assert c3_res.status_code == 201

    # Verify 3 contacts now exist
    list_res = client.get("/api/v1/contacts", headers=headers)
    assert len(list_res.json()) == 3

    # 5. ATTEMPT 4th CONTACT -> MUST FAIL WITH 400
    c4_res = client.post("/api/v1/contacts", json={
        "name": "Fourth Contact",
        "relationship": "Colleague",
        "phone": "+919444444444",
        "preferred_channels": ["sms"]
    }, headers=headers)
    assert c4_res.status_code == 400
    assert "maximum of 3" in c4_res.json()["detail"].lower()

    # 6. Update Contact 1
    patch_res = client.patch(f"/api/v1/contacts/{c1_id}", json={
        "relationship": "Mom",
        "preferred_channels": ["sms", "email"]
    }, headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["relationship"] == "Mom"

    # 7. Delete Contact 1
    del_res = client.delete(f"/api/v1/contacts/{c1_id}", headers=headers)
    assert del_res.status_code == 200

    # Verify 2 contacts remaining
    list_after = client.get("/api/v1/contacts", headers=headers)
    assert len(list_after.json()) == 2
