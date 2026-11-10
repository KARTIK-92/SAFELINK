# SafeLink — REST & Real-time API Reference

All requests must use `application/json` unless uploading multipart files. Authenticated routes require an `Authorization: Bearer <access_token>` header.

---

## 1. Authentication Endpoints

### `POST /api/v1/auth/register`
Register a new user account (Woman or Volunteer).
- **Request Body**:
  ```json
  {
    "phone": "+919876543210",
    "email": "priya.sharma@example.com",
    "password": "StrongPassword123#",
    "role": "woman",
    "full_legal_name": "Priya Sharma",
    "gender": "female",
    "date_of_birth": "1998-05-14",
    "address_line1": "Flat 402, Lotus Heights",
    "address_line2": "MG Road",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pin_code": "560001",
    "accepted_terms": true
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "status": "pending",
    "phone_verification_required": true,
    "email_verification_required": true
  }
  ```

### `POST /api/v1/auth/otp/send`
Send a 6-digit OTP to mobile or email.
- **Request Body**:
  ```json
  {
    "destination": "+919876543210",
    "channel": "phone",
    "purpose": "registration_verification"
  }
  ```
- **Response**: `200 OK` (Generic response preventing enumeration)
  ```json
  {
    "status": "success",
    "message": "If this contact is registered, a 6-digit code has been dispatched. Valid for 5 minutes.",
    "expires_in_seconds": 300
  }
  ```

### `POST /api/v1/auth/otp/verify`
Verify submitted OTP.
- **Request Body**:
  ```json
  {
    "destination": "+919876543210",
    "otp_code": "492018",
    "purpose": "registration_verification"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "verified": true,
    "message": "Phone number verified successfully"
  }
  ```

### `POST /api/v1/auth/login`
Authenticate via Phone/Email + Password OR Phone/Email + OTP.
- **Response**: `200 OK`
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "d7a8b8c1...",
    "token_type": "bearer",
    "expires_in": 900,
    "user": {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "role": "woman",
      "status": "verified",
      "full_legal_name": "Priya Sharma"
    }
  }
  ```

---

## 2. Emergency SOS Endpoints

### `POST /api/v1/sos/start`
Trigger atomic emergency incident.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "latitude": 12.9716,
    "longitude": 77.5946,
    "accuracy_meters": 12.5,
    "address_hint": "Near Cubbon Park Metro Station, Bengaluru"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "incident_id": "c71e2e12-d278-4ea8-b711-d142d72f1025",
    "status": "active",
    "started_at": "2026-11-10T17:15:00Z",
    "tracking_token": "a8f3b20c1e8d4a7b920192e8fa47b3cd182049bf68e21a00b8c9472183e210fa",
    "tracking_url": "https://safelink.app/t/a8f3b20c1e8d4a7b920192e8fa47b3cd182049bf68e21a00b8c9472183e210fa",
    "contacts_notified_count": 3,
    "volunteers_notified_count": 8
  }
  ```

### `POST /api/v1/sos/location`
Push live coordinate update during active emergency.
- **Request Body**:
  ```json
  {
    "incident_id": "c71e2e12-d278-4ea8-b711-d142d72f1025",
    "latitude": 12.9719,
    "longitude": 77.5949,
    "accuracy_meters": 8.0,
    "battery_level": 0.84
  }
  ```
- **Response**: `200 OK`

### `POST /api/v1/sos/cancel`
Cancel an active emergency alert.
- **Request Body**:
  ```json
  {
    "incident_id": "c71e2e12-d278-4ea8-b711-d142d72f1025",
    "reason": "Accidental trigger - I am safe now."
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "cancelled",
    "cancelled_at": "2026-11-10T17:21:40Z",
    "message": "Incident cancelled. Live tracking tokens have been revoked."
  }
  ```

---

## 3. Public Ephemeral Live Tracking

### `GET /api/v1/tracking/{token}`
Accessible by trusted emergency contacts receiving SMS/WhatsApp links.
- **Security**: Ephemeral high-entropy token check; no indexing header `X-Robots-Tag: noindex, nofollow`.
- **Response (Active)**:
  ```json
  {
    "active": true,
    "incident_id": "c71e2e12-d278-4ea8-b711-d142d72f1025",
    "woman_first_name": "Priya",
    "last_latitude": 12.9721,
    "last_longitude": 77.5951,
    "accuracy_meters": 7.5,
    "updated_at": "2026-11-10T17:18:22Z",
    "responders_accepted_count": 1
  }
  ```
- **Response (Cancelled or Expired)**:
  ```json
  {
    "active": false,
    "message": "This emergency alert has ended. Live location is no longer available."
  }
  ```

---

## 4. Volunteer Endpoints

- `POST /api/v1/volunteer/availability` (Toggle `is_available: true/false`)
- `POST /api/v1/volunteer/location` (Update current GPS coordinate)
- `GET /api/v1/volunteer/incidents` (Fetch eligible incidents within range)
- `POST /api/v1/volunteer/incidents/{id}/accept` (Lock and accept response role)
- `POST /api/v1/volunteer/incidents/{id}/decline` (Decline notification)
- `PATCH /api/v1/volunteer/incidents/{id}/status` (Update status: `on_the_way`, `reached_location`, `assistance_completed`)
