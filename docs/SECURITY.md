# SafeLink — Security Architecture & Threat Mitigations

Security is the primary engineering imperative for SafeLink. This document outlines the cryptographic controls, threat models, and architectural safeguards enforced across the stack.

---

## 1. Authentication & Session Security

- **Password Hashing**: Argon2id (`time_cost=3`, `memory_cost=65536` [64MB], `parallelism=4`) with cryptographically secure random per-user salt.
- **Access Tokens**: Short-lived JWTs (15 minutes lifespan) signed via asymmetric RS256 or HS256 with rotation.
- **Refresh Token Rotation & Reuse Detection**: Refresh tokens are single-use. When a refresh token is presented, a new token pair is issued and the old token is marked revoked. If an already-revoked refresh token is presented, the system treats it as token theft, immediately revoking **all active sessions** for that user.
- **Device-Specific Sessions**: Active sessions are logged with device fingerprint, IP hash, and last active timestamp, allowing granular "Logout other devices" functionality.
- **Brute Force & Lockout**: 5 failed login attempts trigger a 15-minute temporary lockout.

---

## 2. OTP Verification Hardening

1. **Entropy**: 6-digit cryptographically pseudo-random numbers generated via `secrets.SystemRandom`.
2. **Storage**: OTPs are never stored in plaintext in the database or Redis. Stored as `HMAC-SHA256(otp_code, server_pepper)`.
3. **Attempt Capping**: Maximum 5 attempts per generated OTP. Upon 5 invalid attempts, the OTP is invalidated immediately.
4. **Rate Limiting**: Cooldown of 60 seconds before re-issuing an OTP to the same phone/email/IP. Maximum 5 OTP dispatches per hour per identifier.
5. **Generic Error Messages**: API endpoints respond with generic messages: *"If this contact is registered, a code has been dispatched"*, eliminating account enumeration attacks.

---

## 3. Location Privacy & Authorization

### 3.1 Strict Need-to-Know Geolocation Access
- **Zero 24/7 Tracking for Women**: The women's mobile application requests foreground and background location **strictly during an active SOS incident**. At all other times, location services are completely idle and dormant.
- **Zero Volunteer Broadcast of Distressed Coordinates**: Push notifications sent to nearby volunteers contain only approximate distance (e.g. `~350m`) and elapsed time. Coordinates are **never** included in the push payload or accessible via API until a volunteer explicitly accepts the incident.
- **Atomic Assignment & Responder Caps**: A maximum of 3 volunteers (configurable) are permitted to accept an incident. Once assigned, location access is granted via scoped session tokens.
- **Instant Token Revocation**: Calling `POST /sos/cancel` marks the incident `cancelled`, purges active Redis keys, and revokes tracking tokens. Any subsequent request to `/t/{token}` or `/sos/{id}/location` immediately returns a terminal message with zero coordinates.

---

## 4. Threat Matrix & Mitigations

| Threat | Risk Level | Mitigation Strategy |
| :--- | :--- | :--- |
| **GPS Spoofing** | High | Accuracy radius validation (`accuracy_meters < 50m`), timestamp freshness checks (< 30s), speed anomaly detection (> 150 km/h triggers warning). |
| **Volunteer Impersonation** | Critical | Mandatory KYC identity verification + active liveness verification; police verification document review for production; admin suspension controls. |
| **Stalking / Location Harvest** | Critical | Volunteers cannot browse or search for women; incidents are only pushed based on server-side PostGIS proximity match; immediate revocation upon cancellation. |
| **Emergency Link Leakage** | High | 256-bit unguessable tokens; `X-Robots-Tag: noindex, nofollow` headers; no third-party trackers or external analytics on tracking pages; instant revocation upon cancellation. |
| **Denial of Service / Alert Flooding** | High | Atomic incident locks per user (only one active SOS per user at any time); rate limits per IP and user ID; cooldown periods. |
