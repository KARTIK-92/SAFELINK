# SafeLink — Deployment Guide

SafeLink services are decoupled for independent scaling and resilient high-availability hosting.

---

## 1. Production Architecture Topology

- **Web Frontend**: Vercel (Next.js 14+ Edge/Node runtime)
- **API Backend**: Render / Railway / AWS ECS Fargate (FastAPI with Uvicorn / Gunicorn workers)
- **Database**: Managed PostgreSQL 16 with PostGIS extension (e.g. Supabase, AWS RDS, Neon, or Railway)
- **Cache & Pub/Sub**: Managed Redis (e.g. Upstash, AWS ElastiCache, or Redis Cloud)
- **Object Storage**: AWS S3 or Cloudflare R2 (Private bucket with pre-signed URL access)
- **Push Notification Gateway**: Firebase Cloud Messaging (FCM HTTP v1 API)

---

## 2. Environment Configuration

Ensure the following variables are configured in production secrets managers:

| Variable | Description | Example / Note |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Deployment environment | `production` |
| `SECRET_KEY` | 256-bit cryptographically secure string | `openssl rand -hex 32` |
| `DATABASE_URL` | Async PostgreSQL + PostGIS connection | `postgresql+asyncpg://...` |
| `DATABASE_URL_SYNC` | Synchronous connection for Alembic | `postgresql://...` |
| `REDIS_URL` | Redis connection URL | `rediss://...` (TLS enabled) |
| `S3_ENDPOINT_URL` | S3 or Cloudflare R2 endpoint | `https://s3.ap-south-1.amazonaws.com` |
| `S3_ACCESS_KEY` | S3 IAM user key | Encrypted secret |
| `S3_SECRET_KEY` | S3 IAM user secret | Encrypted secret |
| `S3_BUCKET_NAME` | Private bucket name | `safelink-kyc-production` |
| `FCM_CREDENTIALS_JSON` | Firebase service account key | Stringified JSON |

---

## 3. Database Migration

Run Alembic migrations before launching updated containers:
```bash
alembic upgrade head
```

---

## 4. Mobile Applications Build

### Android (APK & AAB)
```bash
cd apps/mobile_women
flutter build appbundle --release
cd ../mobile_volunteer
flutter build appbundle --release
```

### iOS (IPA)
```bash
cd apps/mobile_women
flutter build ipa --release
cd ../mobile_volunteer
flutter build ipa --release
```
*(Requires macOS host with Xcode and Apple Developer signing provisioning profile).*
