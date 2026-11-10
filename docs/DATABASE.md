# SafeLink — Database Schema & Data Dictionary

SafeLink utilizes PostgreSQL 16 with the PostGIS 3.4 spatial extension to provide high-precision geolocation indexing and low-latency geospatial proximity queries.

---

## 1. Entity Relationship Overview

```
 [users] 1 ──── 1 [user_profiles]
    │    1 ──── 1 [volunteer_profiles]
    │    1 ──── * [emergency_contacts] (Enforced max 3)
    │    1 ──── * [identity_verifications]
    │    1 ──── * [liveness_verifications]
    │    1 ──── * [user_sessions]
    │    1 ──── * [device_tokens]
    │    1 ──── * [emergency_incidents] (as distressed woman)
    │
 [emergency_incidents] 1 ──── * [incident_volunteers] ──── * [volunteer_profiles]
          │            1 ──── * [incident_location_updates]
          │            1 ──── * [location_access_tokens]
          │            1 ──── * [notification_logs]
          │            1 ──── * [abuse_reports]
```

---

## 2. Table Specifications

### 2.1 `users`
Core authentication and authorization entity.
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `phone` (VARCHAR(20), Unique, Indexed)
- `email` (VARCHAR(255), Unique, Indexed)
- `hashed_password` (VARCHAR(255), Nullable for pure OTP-based users)
- `role` (ENUM: `woman`, `volunteer`, `admin`)
- `status` (ENUM: `pending`, `verified`, `rejected`, `suspended`, `under_review`)
- `is_active` (BOOLEAN, default TRUE)
- `is_phone_verified` (BOOLEAN, default FALSE)
- `is_email_verified` (BOOLEAN, default FALSE)
- `failed_login_attempts` (INTEGER, default 0)
- `locked_until` (TIMESTAMPTZ, Nullable)
- `created_at` (TIMESTAMPTZ, default `now()`)
- `updated_at` (TIMESTAMPTZ, default `now()`)

### 2.2 `user_profiles`
Personal information and address records.
- `id` (UUID, Primary Key)
- `user_id` (UUID, Unique, FK -> `users.id` ON DELETE CASCADE)
- `full_legal_name` (VARCHAR(255))
- `gender` (VARCHAR(50))
- `date_of_birth` (DATE)
- `address_line1` (VARCHAR(255))
- `address_line2` (VARCHAR(255), Nullable)
- `city` (VARCHAR(100))
- `state` (VARCHAR(100))
- `pin_code` (VARCHAR(10))
- `profile_photo_path` (VARCHAR(500), Private Storage Object Key)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 2.3 `emergency_contacts`
Registered family/friends for distress alerts.
- `id` (UUID, Primary Key)
- `user_id` (UUID, FK -> `users.id` ON DELETE CASCADE)
- `name` (VARCHAR(255))
- `relationship` (VARCHAR(100))
- `phone` (VARCHAR(20))
- `email` (VARCHAR(255), Nullable)
- `preferred_channels` (JSONB, e.g. `["sms", "whatsapp", "email"]`)
- `priority_order` (SMALLINT, 1 to 3)
- `is_active` (BOOLEAN, default TRUE)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- *Constraint*: CHECK constraint and database trigger guaranteeing maximum 3 contacts per user.

### 2.4 `volunteer_profiles`
Operational and vetting records for volunteers.
- `id` (UUID, Primary Key)
- `user_id` (UUID, Unique, FK -> `users.id` ON DELETE CASCADE)
- `vehicle_type` (VARCHAR(50), e.g. "foot", "two_wheeler", "four_wheeler")
- `skills` (JSONB, e.g. `["first_aid", "cpr"]`)
- `police_verification_doc_path` (VARCHAR(500), Nullable)
- `is_available` (BOOLEAN, default FALSE)
- `total_incidents_responded` (INTEGER, default 0)
- `last_seen_at` (TIMESTAMPTZ, Nullable)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 2.5 `volunteer_locations`
Real-time spatial tracking for available volunteers.
- `id` (BIGSERIAL, Primary Key)
- `volunteer_id` (UUID, FK -> `volunteer_profiles.id` ON DELETE CASCADE)
- `location` (GEOGRAPHY(Point, 4326), Indexed with GiST)
- `latitude` (DOUBLE PRECISION)
- `longitude` (DOUBLE PRECISION)
- `accuracy_meters` (FLOAT)
- `speed` (FLOAT, Nullable)
- `heading` (FLOAT, Nullable)
- `recorded_at` (TIMESTAMPTZ, Indexed)

### 2.6 `emergency_incidents`
Active and archived distress events.
- `id` (UUID, Primary Key)
- `woman_id` (UUID, FK -> `users.id` ON DELETE RESTRICT)
- `status` (ENUM: `active`, `resolved`, `cancelled`, `expired`)
- `start_location` (GEOGRAPHY(Point, 4326), Indexed with GiST)
- `start_latitude` (DOUBLE PRECISION)
- `start_longitude` (DOUBLE PRECISION)
- `start_accuracy` (FLOAT)
- `address_snapshot` (TEXT, Nullable)
- `tracking_token_hash` (VARCHAR(64), Unique, Indexed)
- `cancellation_reason` (TEXT, Nullable)
- `search_radius_meters` (INTEGER, default 1000)
- `started_at` (TIMESTAMPTZ, default `now()`)
- `cancelled_at` (TIMESTAMPTZ, Nullable)
- `resolved_at` (TIMESTAMPTZ, Nullable)
- `expires_at` (TIMESTAMPTZ, default `now() + INTERVAL '6 hours'`)

### 2.7 `incident_volunteers`
Responder assignment and dispatch states.
- `id` (UUID, Primary Key)
- `incident_id` (UUID, FK -> `emergency_incidents.id` ON DELETE CASCADE)
- `volunteer_id` (UUID, FK -> `volunteer_profiles.id` ON DELETE CASCADE)
- `status` (ENUM: `alert_received`, `accepted`, `on_the_way`, `reached_location`, `assistance_completed`, `unable_to_assist`, `cancelled`)
- `initial_distance_meters` (INTEGER)
- `notified_at` (TIMESTAMPTZ)
- `responded_at` (TIMESTAMPTZ, Nullable)
- `arrived_at` (TIMESTAMPTZ, Nullable)

### 2.8 `incident_location_updates`
Live GPS location trail of the distressed woman during active incident.
- `id` (BIGSERIAL, Primary Key)
- `incident_id` (UUID, FK -> `emergency_incidents.id` ON DELETE CASCADE)
- `location` (GEOGRAPHY(Point, 4326))
- `latitude` (DOUBLE PRECISION)
- `longitude` (DOUBLE PRECISION)
- `accuracy_meters` (FLOAT)
- `battery_level` (FLOAT, Nullable)
- `recorded_at` (TIMESTAMPTZ, default `now()`)

### 2.9 `location_access_tokens`
Cryptographic tokens for live tracking link `/t/{token}`.
- `id` (UUID, Primary Key)
- `token_hash` (VARCHAR(64), Unique, Indexed)
- `incident_id` (UUID, FK -> `emergency_incidents.id` ON DELETE CASCADE)
- `recipient_type` (VARCHAR(50): `contact`, `assigned_volunteer`, `official_service`)
- `recipient_ref` (VARCHAR(255))
- `expires_at` (TIMESTAMPTZ)
- `is_revoked` (BOOLEAN, default FALSE)
- `revoked_at` (TIMESTAMPTZ, Nullable)

### 2.10 `notification_logs`
Delivery audit records for SMS, WhatsApp, Email, and Push notifications.
- `id` (UUID, Primary Key)
- `incident_id` (UUID, FK -> `emergency_incidents.id` ON DELETE CASCADE)
- `channel` (VARCHAR(20): `sms`, `whatsapp`, `email`, `fcm`)
- `recipient` (VARCHAR(255))
- `status` (VARCHAR(30): `pending`, `sent`, `delivered`, `failed`)
- `provider_name` (VARCHAR(50))
- `provider_message_id` (VARCHAR(255), Nullable)
- `error_message` (TEXT, Nullable)
- `dispatched_at` (TIMESTAMPTZ, default `now()`)

### 2.11 `audit_logs` & `abuse_reports`
- Immutable system audit trail and incident reporting table for administrative and regulatory oversight.

---

## 3. Spatial Indexes

```sql
CREATE INDEX idx_volunteer_locations_geom ON volunteer_locations USING GIST (location);
CREATE INDEX idx_emergency_incidents_geom ON emergency_incidents USING GIST (start_location);
CREATE INDEX idx_incident_location_updates_geom ON incident_location_updates USING GIST (location);
CREATE INDEX idx_active_volunteers ON volunteer_profiles (is_available) WHERE is_available = true;
```
