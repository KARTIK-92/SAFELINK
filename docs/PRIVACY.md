# SafeLink — Privacy Policy, Data Governance & DPDP Compliance

SafeLink is engineered around privacy-by-design and purpose limitation, adhering to the principles outlined in India's **Digital Personal Data Protection Act (DPDP Act 2023)** and international privacy standards.

---

## 1. Core Principles

1. **Purpose Limitation**: Data collected is strictly used for identity verification and life-safety distress dispatch. It is never sold, shared with advertising networks, or monetized.
2. **Data Minimization**:
   - Women's locations are recorded **only** during an active SOS window.
   - Volunteers' locations are recorded **only** when they explicitly toggle `Available` status.
   - National ID numbers (e.g., Aadhaar) are **never stored in full**. Only cryptographic verification tokens, reference IDs, and verification statuses returned by authorized KYC providers are retained.
3. **Storage Limitation & Auto-Purge**:
   - High-frequency GPS breadcrumbs (`incident_location_updates`) are purged 48 hours after incident resolution or cancellation.
   - Ephemeral live-tracking access tokens are immediately invalidated upon SOS cancellation.
4. **Right to Erasure (Account Deletion)**:
   - Users may initiate full account deletion from the dashboard.
   - Deletion removes: profile records, emergency contact relationships, device tokens, session cookies, and private KYC photographs from S3/MinIO.
   - Legally mandated non-identifying audit summaries are retained strictly for forensic compliance.

---

## 2. Consent Architecture

- **Registration Consent**: Explicit opt-in notice explaining that emergency contacts will receive SMS/WhatsApp messages with location links during an emergency.
- **Emergency Contact Notification**: Upon being added by a user, emergency contacts receive a one-time onboarding notification with details on their designation and instructions on how to opt-out.
- **Volunteer Consent**: Clear disclosure that enabling "Available" mode periodically samples battery-aware background location to compute proximity to distress events.

---

## 3. DPDP Act Compliance Checklist

- [x] Clear and conspicuous notice presented before data collection.
- [x] Multilingual consent support planned for national rollout.
- [x] Contact details of Grievance Redressal / Data Protection Officer published.
- [x] Verified age gate enforcing 18+ eligibility.
- [x] Right to withdraw consent and delete data accessible directly in user settings.
- [x] Strict role-based access control protecting user directories.
- [x] End-to-end encryption in transit (TLS 1.3) and encryption at rest (AES-256).

> **Disclaimer**: This documentation and codebase serve as an engineering implementation. A comprehensive legal review with qualified counsel must precede any public or production deployment.
