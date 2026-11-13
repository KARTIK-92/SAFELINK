# SafeLink — Women's Safety & Rapid Emergency Response Platform

> **"Help Should Never Be Too Far Away."**

SafeLink is a full-stack, enterprise-grade emergency response ecosystem designed to bridge the critical gap between an emergency distress call and human arrival. By pairing instant emergency contact notification with privacy-preserving, PostGIS-powered nearby volunteer dispatch, SafeLink mobilizes verified community assistance while emergency services (112) and family members are on their way.

---

## 🏛 System Architecture & Workflow

```
                                    +-----------------------------------------+
                                    |       Distressed Woman (Mobile App)     |
                                    |  Hold 1.5s SOS -> Captures High-Res GPS |
                                    +--------------------+--------------------+
                                                         |
                                            POST /api/v1/sos/start
                                                         |
                                                         v
                                    +--------------------+--------------------+
                                    |     SafeLink Emergency Engine (API)     |
                                    |  - Generates 256-bit ephemeral token    |
                                    |  - Concurrency & duplicate check        |
                                    +---------+--------------------+----------+
                                              |                    |
                                              |                    |
                         +--------------------+                    +---------------------+
                         |                                                               |
                         v                                                               v
+------------------------+-----------------------+              +------------------------+-----------------------+
|        Emergency Contacts (Max 3)              |              |     Verified Volunteers Proximity Search      |
|  - SMS, WhatsApp & Email Alerts                |              |  - Haversine / PostGIS Query (1 km radius)     |
|  - Ephemeral Link: https://safelink.org/t/:tok |              |  - Zero victim PII / Zero raw coordinates     |
|  - Live map, coordinates & CALL 112 button     |              |  - Push alert: "Assistance needed ~250m away"  |
+------------------------------------------------+              +------------------------+-----------------------+
                                                                                         |
                                                                             Volunteer Accepts Alert
                                                                         (Atomic Cap: Max 3 Responders)
                                                                                         |
                                                                                         v
                                                                +------------------------+-----------------------+
                                                                |      Turn-by-Turn Dispatch Navigation         |
                                                                |  - Unlocks precise GPS & victim initial       |
                                                                |  - Stepper: On the Way -> Arrived -> Safe     |
                                                                +-----------------------------------------------+
```

---

## 🔑 Pre-Seeded Demonstration Accounts

Run `python apps/api/scripts/seed_dev_data.py` to seed these ready-to-test accounts:

| Role | Name | Identifier (Mobile / Email) | Password | Features / State |
| :--- | :--- | :--- | :--- | :--- |
| **Woman** | Priya Sharma | `+919888800001`<br>`priya.sos@example.com` | `WomanPassword123#` | Verified account, 2 Emergency Contacts configured (Mother & Friend), SOS ready. |
| **Volunteer** | Rajesh Nair | `+919888800002`<br>`rajesh.vol@example.com` | `VolPassword123#` | Verified responder, Two-Wheeler, First-Aid trained, **AVAILABLE**, location set ~200m from MG Road. |
| **Administrator** | SecOps Admin | `+919888800003`<br>`admin@safelink.gov.in` | `AdminPassword123#` | Full administrative privileges, abuse moderation, account review. |

---

## 📁 Monorepo Structure

```
SAFELINK/
├── apps/
│   ├── web/                     # Next.js 14+ (App Router, Tailwind CSS, Lucide Icons)
│   │   ├── src/app/             # 14 static pages + 1 dynamic route (/t/[token])
│   │   │   ├── page.tsx         # Public Landing Page & Hero
│   │   │   ├── register/        # 7-Step Verified Registration Wizard
│   │   │   ├── login/           # Multi-mode Auth Portal (Password + OTP)
│   │   │   ├── dashboard/woman/ # Emergency contacts, live protection status, DPDP deletion
│   │   │   ├── dashboard/volunteer/ # Availability toggle, credentials card, guidelines
│   │   │   └── t/[token]/       # Public Ephemeral Live Tracking Portal (NoIndex, Auto-polling)
│   │   └── Dockerfile           # Multi-stage production container
│   │
│   ├── api/                     # FastAPI (Python 3.12, SQLAlchemy 2.0 Async, PostGIS)
│   │   ├── app/
│   │   │   ├── api/v1/          # Endpoints: auth, users, verification, contacts, volunteer, sos, tracking, reports
│   │   │   ├── core/            # Config, Argon2id security, Haversine geo calculations, database
│   │   │   ├── models/          # 15 SQLAlchemy tables with strict relational integrity
│   │   │   ├── schemas/         # Pydantic V2 validated DTOs
│   │   │   └── services/        # EmergencyEngine, OTP, Notifications, KYC Verification
│   │   ├── tests/               # 17 Automated tests (100% pass rate)
│   │   ├── scripts/             # seed_dev_data.py
│   │   └── Dockerfile           # Production container with unprivileged user & healthchecks
│   │
│   ├── mobile_women/            # Flutter app for distressed women
│   │   ├── lib/src/features/    # Hold-to-activate SOS button (1.5s haptic fill), live GPS streaming
│   │   └── android/ & ios/      # Foreground service and location permission manifests
│   │
│   └── mobile_volunteer/        # Flutter app for community responders
│       ├── lib/src/features/    # Availability toggle, proximity alert cards, Google Maps navigation
│       └── android/ & ios/      # Background location and emergency call manifests
│
├── packages/
│   └── shared_dart/             # Shared Dart models, theme tokens, and API constants
│
├── infrastructure/
│   ├── docker/postgres/         # PostGIS initialization scripts
│   └── deployment/              # Production orchestration manifests
│
├── docs/                        # Complete technical and compliance documentation
│   ├── ARCHITECTURE.md          # End-to-end system and event lifecycle
│   ├── DATABASE.md              # PostGIS schema, spatial indexes and relationships
│   ├── API.md                   # REST interface and schemas
│   ├── SECURITY.md              # Cryptographic controls and token rotation
│   ├── PRIVACY.md               # Data minimization & DPDP Act compliance
│   ├── DEPLOYMENT.md            # Hosting and CI/CD guide
│   └── INTEGRATIONS.md          # DigiLocker, SMS, WhatsApp, FCM adapters
│
├── .github/workflows/
│   ├── ci.yml                   # Automated testing (Pytest, Next.js build, Dart analyze)
│   └── deploy.yml               # Container build & Vercel deployment pipeline
├── docker-compose.yml           # Multi-service orchestration (PostGIS, Redis, MinIO, API, Web)
├── .env.example                 # Configuration template
└── README.md
```

---

## ⚡ Quickstart Guide

### Option A: One-Command Docker Compose

```bash
# 1. Clone repository
git clone https://github.com/example/safelink.git
cd SAFELINK

# 2. Configure environment
cp .env.example .env

# 3. Boot all services
docker-compose up --build
```

**Services booted:**
- **Web Portal**: [http://localhost:3000](http://localhost:3000)
- **API Documentation & Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **MinIO Storage Console**: [http://localhost:9001](http://localhost:9001) (`minioadmin` / `minioadmin`)

---

### Option B: Bare-Metal Local Development

#### 1. Backend (FastAPI + Python 3.12)
```bash
cd apps/api

# Create & activate virtualenv
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Seed demonstration accounts
python scripts/seed_dev_data.py

# Run API server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Web Portal (Next.js 14)
```bash
cd apps/web

# Install dependencies
npm install

# Start development server
npm run dev
```

#### 3. Run Mobile Apps (Flutter)
```bash
# Women's App
cd apps/mobile_women
flutter pub get
flutter run

# Volunteer Responder App
cd apps/mobile_volunteer
flutter pub get
flutter run
```

---

## 🧪 Automated Testing & Verification

### Run Backend Pytest Suite (17 Tests)
```bash
cd apps/api
pytest tests -v
```
**Test Coverage Includes:**
- `test_auth.py`: 18+ age restriction gate, registration, Argon2id hashing, OTP generation.
- `test_contacts.py`: Emergency contacts lifecycle and strict 3-contact limit enforcement.
- `test_emergency.py`: Atomic SOS initiation, duplicate prevention (409 Conflict), volunteer proximity discovery, volunteer acceptance (max 3 lock), continuous GPS streaming, token revocation upon cancellation, tracking denial post-cancellation.
- `test_volunteer_dashboard.py`: Availability toggle, location updates rejected while offline.
- `test_compliance_and_abuse.py`: ASGI security headers (CSP, HSTS, X-Content-Type-Options), DPDP machine-readable data export, DPDP cryptographic PII shredding on deletion, and abuse reporting with admin suspension.

### Run Next.js Production Build
```bash
cd apps/web
npm run build
```
Generates 14 static pages and the `/t/[token]` dynamic ephemeral tracking route with zero type errors.

---

## 🔒 Security, Privacy & Compliance (DPDP Act 2023)

1. **Strict Zero 24/7 Background Tracking**: Women's locations are streamed **strictly** during an active SOS emergency.
2. **Privacy-Preserving Volunteer Dispatch**: Volunteer push alerts disclose **zero** victim PII and **zero** precise coordinates prior to acceptance (only approximate distance like `~250m` is visible).
3. **256-Bit Cryptographic Ephemeral Links**: Emergency contact tracking links use unguessable 256-bit entropy. Only SHA-256 hashes are stored in the database.
4. **Immediate Revocation**: Cancelling an emergency immediately revokes all access tokens and halts location streaming.
5. **DPDP Compliance**:
   - `GET /api/v1/users/me/export`: Right to Access & Data Portability.
   - `DELETE /api/v1/users/me`: Right to Erasure with cryptographic PII shredding.
6. **Volunteer Capacity Lock**: Capped at `MAX_ASSIGNED_RESPONDERS = 3` to prevent crowd convergence.
7. **Emergency Helpline Integration**: Prominent **CALL 112** actions throughout all apps. Volunteers are an auxiliary layer of human presence and never replace official emergency services.

---

## 🚀 100% Free Production Deployment (Zero Server Cost)

SafeLink is engineered to run completely **free of cost** using generous, production-ready cloud free tiers:

| Component | Free Tier Provider | Limits / Free Allowance | Setup Effort |
| :--- | :--- | :--- | :--- |
| **Web Portal** | [Vercel](https://vercel.com) | Unlimited traffic, automatic HTTPS, global Edge CDN | 1-Click GitHub Import |
| **Backend API** | [Render](https://render.com) | Free Web Service (Docker / Python), automatic HTTPS | 1-Click GitHub Web Service |
| **Database (PostGIS)** | [Supabase](https://supabase.com) | 500 MB PostgreSQL + native PostGIS extension pre-installed | 2-minute sign-up |
| **Cache & Real-Time** | [Upstash](https://upstash.com) | 10,000 commands/day serverless Redis | Instant free database |
| **Private KYC Storage** | [Supabase Storage](https://supabase.com) / [Cloudflare R2](https://cloudflare.com) | 10 GB free S3-compatible private object storage | Included in free tier |
| **Push Notifications** | [Firebase Cloud Messaging](https://firebase.google.com) | 100% Free Forever for unlimited push notifications | Google account |
| **Email Gateway** | [Resend](https://resend.com) | 3,000 free emails/month forever | Free API key |
| **Direct App APKs** | Hosted directly in `apps/web/public/downloads/` | Available for direct download at `/download` | Zero extra cost |

### Continuous Deployment (CI/CD) Workflow
Whenever you push changes or new code to your GitHub repository:
1. **GitHub Actions** runs the automated test suite (`pytest`) and Next.js production build check.
2. **Vercel** automatically detects commits affecting `apps/web` and rebuilds/deploys the updated frontend within 45 seconds.
3. **Render** automatically pulls the latest commit and redeploys the backend API container with zero downtime.

---

## 📄 License
This project is licensed under the Apache 2.0 License.
