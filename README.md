# SafeLink — Women's Safety & Rapid Emergency Response Platform

> **"Help Should Never Be Too Far Away."**

SafeLink is a full-stack, enterprise-grade women's safety ecosystem designed to bridge the critical gap between an emergency distress call and human arrival. By pairing rapid contact alerts with high-precision, PostGIS-powered nearby volunteer dispatch, SafeLink mobilizes verified community assistance while emergency services and family members are on their way.

---

## 📁 Monorepo Structure

```
SAFELINK/
├── apps/
│   ├── web/                     # Next.js 14+ (App Router, Tailwind, Shadcn UI)
│   ├── api/                     # FastAPI (Python 3.11+, SQLAlchemy 2.0, PostGIS, Redis)
│   ├── mobile_women/            # Flutter app for women (One-handed SOS button, GPS stream)
│   └── mobile_volunteer/        # Flutter app for volunteers (Availability, Nearby Alerts)
├── packages/
│   └── shared_dart/             # Shared Dart models, enums & API client utilities
├── infrastructure/
│   ├── docker/                  # Dockerfiles & PostgreSQL/PostGIS init scripts
│   └── deployment/              # Kubernetes / Cloud deployment manifests
├── docs/                        # Complete technical and compliance documentation
│   ├── ARCHITECTURE.md          # End-to-end system and event lifecycle
│   ├── DATABASE.md              # PostGIS schema, indexes and tables
│   ├── API.md                   # REST and WebSocket interface reference
│   ├── SECURITY.md              # Threat modeling, token rotation, cryptographic controls
│   ├── PRIVACY.md               # Data minimization & DPDP Act compliance
│   ├── DEPLOYMENT.md            # Hosting and CI/CD guide
│   └── INTEGRATIONS.md          # DigiLocker, SMS, WhatsApp, FCM adapters
├── docker-compose.yml           # Full local environment (PostGIS, Redis, MinIO, API, Web)
├── .env.example                 # Configuration environment template
└── README.md
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js 18+ (tested on Node v24)
- Python 3.11 or 3.12
- Docker & Docker Compose (optional for containerized setup)
- Flutter 3.19+ (for mobile builds)

### 1. Clone & Setup Environment
```bash
git clone https://github.com/example/safelink.git
cd SAFELINK
cp .env.example .env
```

### 2. Run with Docker Compose
```bash
docker-compose up --build
```
This boots:
- **Web Portal**: `http://localhost:3000`
- **FastAPI Backend & Swagger**: `http://localhost:8000/docs`
- **PostgreSQL with PostGIS**: `localhost:5432`
- **Redis Cache & Pub/Sub**: `localhost:6379`
- **MinIO S3 Console**: `http://localhost:9001`

---

## 🧪 Running Automated Tests

```bash
# Backend unit & integration tests
cd apps/api
pytest
```

---

## 📜 Legal & Safety Notice
SafeLink verified volunteers are an auxiliary layer of rapid community assistance, **never** a replacement for the police, medical ambulances, or official national emergency services (e.g., 112).
