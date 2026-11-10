# SafeLink — System Architecture & Data Flow

SafeLink is an enterprise-grade women's safety and rapid emergency response platform designed to minimize the critical window between distress detection and on-scene human assistance.

---

## 1. High-Level Architecture

The platform consists of three connected application tiers and a high-performance backend:

```
┌────────────────────────────────────────────────────────┐
│                   CLIENT APPLICATIONS                   │
│                                                        │
│   ┌──────────────────┐   ┌─────────────────────────┐   │
│   │  Women's Mobile  │   │   Volunteer Mobile App  │   │
│   │  App (Flutter)   │   │        (Flutter)        │   │
│   └────────┬─────────┘   └────────────┬────────────┘   │
│            │                          │                │
│            │     ┌────────────────────┴────────────┐   │
│            │     │  Web Application (Next.js 14+)  │   │
│            │     │  Landing, Portal, Dashboards,   │   │
│            │     │  Tracking /t/{token}            │   │
│            │     └────────────────────┬────────────┘   │
└────────────┼──────────────────────────┼────────────────┘
             │                          │
             ▼                          ▼
┌────────────────────────────────────────────────────────┐
│               API & REAL-TIME GATEWAY                  │
│                                                        │
│               FastAPI (Python 3.11/3.12)               │
│                                                        │
│  - REST Endpoints (/auth, /sos, /volunteer, /contacts) │
│  - WebSocket / SSE Hub (Live Location Stream)          │
│  - Background Dispatchers & Queue Workers              │
└────────────┬──────────────────────────┬────────────────┘
             │                          │
             ▼                          ▼
┌─────────────────────────┐  ┌───────────────────────────┐
│     DATA & CACHING      │  │    NOTIFICATION ENGINE    │
│                         │  │                           │
│  - PostgreSQL 16 +      │  │  - Push (Firebase FCM)    │
│    PostGIS 3.4 (Spatial)│  │  - SMS (DLT/MSG91/Twilio) │
│  - Redis 7.2 (Pub/Sub & │  │  - WhatsApp Business API  │
│    Rate Limiting Cache) │  │  - Transactional Email    │
│  - S3 / MinIO (Secure   │  │    (SMTP/Resend)          │
│    Private Documents)   │  │                           │
└─────────────────────────┘  └───────────────────────────┘
```

---

## 2. Core Operational Workflows

### 2.1 SOS Emergency Lifecycle

```
[Woman initiates SOS]
         │ (Hold button 1.5s with haptic feedback)
         ▼
[POST /sos/start] (Atomic Transaction)
         ├── Validates account verification status (must be active & verified)
         ├── Validates GPS accuracy and timestamp freshness (< 30s)
         ├── Generates cryptographically secure 256-bit tracking token
         ├── Creates EmergencyIncident record (Status: ACTIVE)
         └── Publishes IncidentCreated event to Redis
         │
         ├──► [Emergency Contacts Notification Worker]
         │        ├── Look up up to 3 verified emergency contacts
         │        ├── Format secure URL: https://safelink.app/t/{opaque_token}
         │        └── Dispatch SMS, WhatsApp, & Email in parallel (non-blocking)
         │
         ├──► [Volunteer Proximity Discovery Worker (PostGIS)]
         │        ├── ST_DWithin search for verified, available volunteers (1 km radius)
         │        ├── Filter: last location update < 5 mins old, not suspended
         │        ├── Order by ST_Distance, take nearest 15 candidates
         │        ├── If count < 3, auto-expand search radius to 2 km once
         │        └── Send generic FCM push notification:
         │            "Emergency nearby (~450m). Tap to view and accept."
         │            (NOTE: Zero PII or precise location revealed at this stage!)
         │
         └──► [Live Location Streaming]
                  Woman app streams coordinates every 3-5 seconds via POST /sos/location
                  Redis Pub/Sub broadcasts to /ws/incidents/{incident_id}/live-tracking

[Volunteer Action]
         │
         ├── Volunteer presses "Accept Incident"
         ▼
[POST /volunteer/incidents/{id}/accept]
         ├── Enforces concurrency lock (Redis distributed lock)
         ├── Enforces max responder limit (e.g., max 3 accepted responders)
         ├── Marks IncidentVolunteer status = ACCEPTED
         ├── Authorizes volunteer to stream exact incident coordinate stream
         └── Woman's screen immediately displays: "Volunteer Vikram (280m away) accepted"

[Emergency Resolution or Cancellation]
         │ Woman presses "Cancel Alert" or Admin/System resolves
         ▼
[POST /sos/cancel]
         ├── Atomic status update -> CANCELLED
         ├── Instant revocation of tracking token in database and Redis cache
         ├── Invalidate active WebSocket connections
         ├── Broadcast cancellation push to accepted volunteers
         ├── Send cancellation SMS to emergency contacts
         └── Subsequent /t/{token} requests return:
             "This emergency alert has ended. Live location is no longer available."
```

---

## 3. Security Boundary & Privacy Segregation

1. **Zero-Knowledge Lock-screen Notifications**: Volunteer notifications contain only relative distance and timestamp. No name, photo, phone, or precise lat/long is ever broadcast prior to explicit assignment.
2. **Ephemeral Access Tokens**: Contact tracking tokens are 256-bit cryptographically secure strings stored as SHA-256 hashes in PostgreSQL. They are instantly revoked upon cancellation.
3. **Identity Document Isolation**: KYC and liveness images are saved to private S3 buckets and accessed solely through pre-signed URLs with a 5-minute lifespan.
4. **Audit Immutability**: All sensitive actions (verification reviews, cancellations, tracking access) write append-only records to `audit_logs`.

---

## 4. Scalability & Fault Tolerance

- **Async Concurrency**: FastAPI async endpoints handle thousands of concurrent location pings per second.
- **Independent Notification Resiliency**: SMS provider failure does not interrupt WhatsApp or Email delivery.
- **Fallback Safe SOS**: If network fails during SOS activation on mobile, the application offers an immediate fallback to open the native OS SMS app with pre-filled distress coordinates directed to the user's primary emergency contact.
