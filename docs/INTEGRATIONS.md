# SafeLink — External Provider Integrations Guide

SafeLink uses an abstract adapter architecture (`Provider Pattern`) allowing seamless switching between local Mock adapters for offline development and certified production third-party vendors.

---

## 1. Verification Providers (`VerificationProvider`)

Located in `apps/api/app/services/verification_provider.py`.

### A. MockVerificationProvider
- Default in development mode.
- Simulates instant or configurable KYC verification.
- Clearly flags accounts as `is_mock_verified: true` and logs audit events stating that no legal identity check took place.

### B. DigiLocker & Authorized KYC Integration
To enable official DigiLocker API integration:
1. Register as a Requester Organization with the Digital Locker National Authority.
2. Obtain Client ID, Client Secret, and RSA signing certificates.
3. Configure OAuth 2.0 flow:
   - User redirected to DigiLocker consent screen.
   - Callback receives authorization code.
   - Exchange code for access token.
   - Retrieve XML/JSON URI of Aadhaar document.
   - Compute verification digest without storing raw UID.

---

## 2. Notification Providers (`NotificationProvider`)

Located in `apps/api/app/services/notification_provider.py`.

### A. SMS Gateway (MSG91 / Twilio)
- **Indian DLT Compliance**: Requires registered Principal Entity ID (PE ID) and Template ID from Telecom Operators (Jio/Airtel/Vodafone).
- Sample Template:
  > `[SafeLink] EMERGENCY ALERT: {#var#} has activated SOS at {#var#}. Live location link: {#var#} . Please act immediately.`

### B. WhatsApp Business API (Meta)
- Requires Meta Business Manager approval and verified WhatsApp Business Account (WABA).
- Requires pre-approved Template Message category: `UTILITY` or `AUTHENTICATION`.

### C. Push Notifications (Firebase FCM v1)
- Uses Google Service Account JSON to authenticate via HTTP v1 API.
- Generates data-only silent pings for background coordinate sync, and high-priority heads-up notifications for nearby volunteer alerts.

---

## 3. Storage Providers (`StorageProvider`)

Located in `apps/api/app/services/storage_provider.py`.
- **Local Provider**: Stores files in a local directory for testing.
- **MinIO**: High-performance S3-compatible local Docker storage.
- **AWS S3 / Cloudflare R2**: Secure object storage with pre-signed upload and download URLs (TTL: 300 seconds). No identity photos are ever served directly through public buckets.
