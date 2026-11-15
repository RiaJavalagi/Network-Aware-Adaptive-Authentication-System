# Network-Aware Adaptive Authentication System with Explainable Risk Analysis

A full-stack, defense-in-depth cybersecurity application integrating **Argon2id** password hashing, **TOTP** multi-factor authentication, **network traffic & subnet intelligence**, **device recognition**, and a **rule-based explainable risk engine**.

The system dynamically analyzes authentication attempts and connection metadata to decide whether to **Allow**, require **TOTP Verification**, apply **Rate Limiting**, **Restrict Suspicious Requests**, or **Deny Access**—with granular explanations for every classification.

---

## Architecture Overview

```
                      +------------------------------------------+
                      | React Frontend (Vite, Recharts, Lucide)  |
                      | Port: 5173 (Dev) / Port 80 (Prod)        |
                      +--------------------+---------------------+
                                           |
                                  HTTP / HTTPS
                                           |
                      +--------------------v---------------------+
                      |       Nginx Reverse Proxy / Gateway      |
                      |       (Port 80/443, Real-IP Filtering)   |
                      +--------------------+---------------------+
                                           |
                               Forwarded HTTP Requests
                                           |
                      +--------------------v---------------------+
                      |           FastAPI Backend                |
                      |           Port: 8000                     |
                      +--------------------+---------------------+
                                           |
       +--------------------+--------------+--------------+--------------------+
       |                    |                             |                    |
+------v------+      +------v------+               +------v------+      +------v------+
| Auth Module |      |   Network   |               | Device Mgt  |      | Risk Engine |
|  Argon2id   |      |  Monitoring |               | Fingerprint |      | Explainable |
|  TOTP 2FA   |      | IP / Subnet |               | Trust State |      | Multi-Factor|
|  Sessions   |      | Frequency   |               | Revocation  |      | Scoring     |
+------+------+      +------+------+               +------+------+      +------+------+
       |                    |                             |                    |
       +--------------------+--------------+--------------+--------------------+
                                           |
                                  Data & Cache Layer
                                           |
                        +------------------+------------------+
                        |                                     |
               +--------v-------+                    +--------v-------+
               |  PostgreSQL 16 |                    |    Redis 7     |
               | Persistent DB  |                    | Ephemeral Rate |
               | Users, Devices |                    | Limits, OTP &  |
               | Audits & Logs  |                    | Session Cache  |
               +----------------+                    +----------------+
```

---

## Technology Stack

- **Frontend:** React 18, Vite, Lucide React, Recharts, Custom Cyber Theme
- **Backend:** Python 3.12+, FastAPI, Uvicorn, Pydantic v2
- **Database & Cache:** PostgreSQL 16, SQLAlchemy 2.0 (AsyncIO), Alembic, Redis 7
- **Security & Cryptography:** `argon2-cffi`, `pyotp`, `cryptography` (Fernet for TOTP secrets), `qrcode[pil]`, HTTP-only SameSite cookies
- **Networking & Threat Detection:** Nginx reverse proxy, Python `ipaddress` subnet & IP analysis, sliding-window request frequency tracking
- **Testing & Deployment:** Pytest, Docker Compose, Nginx

---

## Implementation Roadmap

| Phase | Description | Status |
|---|---|---|
| **Phase 1** | Project Structure, Git, React + Vite, FastAPI, and Connectivity | **Completed** |
| **Phase 2** | PostgreSQL, SQLAlchemy Models, Alembic Migrations | **Completed** |
| **Phase 3** | User Registration, Login, Argon2id Password Hashing, Session Management | **Active** |
| **Phase 4** | TOTP Enrollment (QR Code), Verification, Skew Handling, Secret Encryption | Upcoming |
| **Phase 5** | Nginx Reverse Proxy, Network Metadata Extraction, Subnet Logging | Upcoming |
| **Phase 6** | Device Recognition, Fingerprinting, Trust & Revocation Registry | Upcoming |
| **Phase 7** | Explainable Risk Engine (Multi-signal scoring, granular factor breakdowns) | Upcoming |
| **Phase 8** | Adaptive Policy Engine & Redis-based Rate Limiting / State Management | Upcoming |
| **Phase 9** | Security Attack Simulation Lab (Brute force, credential stuffing, IP hops) | Upcoming |
| **Phase 10** | React Security Dashboard (Network analytics, risk breakdown, Recharts) | Upcoming |
| **Phase 11** | Evaluation & Benchmarking (Detection rates, latency, comparative metrics) | Upcoming |
| **Phase 12** | Multi-container Docker Compose Deployment & Final Documentation | Upcoming |

---

## Getting Started (Phase 1 Baseline)

### Prerequisites
- Python 3.12+
- Node.js 20+ & npm 10+
- Git

### 1. Repository Setup & Environment
```bash
git clone <repo-url>
cd argon2id

# Create local environment config
cp .env.example .env
```

### 2. Backend Setup
```bash
# Set up Python virtual environment
python -m venv backend/.venv

# Activate virtual environment (Windows PowerShell)
.\backend\.venv\Scripts\Activate.ps1

# Activate virtual environment (Linux / macOS)
source backend/.venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run automated tests
pytest backend/app/tests -v

# Start FastAPI development server
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
API Documentation will be available at `http://127.0.0.1:8000/api/docs`.

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser. The application includes a live connectivity test verifying communication with the FastAPI `/api/health` endpoint.

---

## Verification & Health Check

The backend exposes `GET /api/health`:
```json
{
  "status": "ok",
  "version": "0.1.0",
  "environment": "development",
  "timestamp": "2026-11-15T13:30:00Z",
  "services": {
    "api": "healthy",
    "database": "configured",
    "redis": "configured"
  }
}
```
All endpoints enforce standard security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`).
