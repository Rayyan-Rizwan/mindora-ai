# Mindora — AI Mental Wellness Platform

Mindora is a final-year project that combines a React web app with a FastAPI
backend to support mental-wellbeing self-check-ins: guided assessments, an
AI companion grounded in psychology reference material, mood tracking, and
connections to mental-health professionals.

> **Wellbeing disclaimer**
> Mindora is an educational/wellbeing support project. It is **not** a medical
> device and does not provide diagnosis, treatment, or emergency care. AI
> responses can be incomplete or wrong. If you or someone else is in danger,
> contact local emergency services or a crisis line immediately.

- **Live demo:** [mindora-ai-frontend.vercel.app](https://mindora-ai-frontend.vercel.app)
- **Repository:** [github.com/Rayyan-Rizwan/mindora-ai](https://github.com/Rayyan-Rizwan/mindora-ai)
- **Project status report:** [reports/FINAL_PROJECT_STATUS_REPORT_2026-10-26.md](reports/FINAL_PROJECT_STATUS_REPORT_2026-10-26.md)

## Overview

The frontend is a static React build. The backend, SQLite database, ChromaDB
vector store, and AI/RAG services run on a single machine and are reachable
during demos through a tunnel. Local secrets, user data, datastores, logs, and
tunnel addresses are ignored by Git and are not part of this repository.

## Features

### Available in this repository

- **Accounts and access control** — registration, email verification, login,
  password reset, JWT sessions, and role-based access for patients,
  professionals, and administrators.
- **Self-assessments** — WHO-5 Well-Being Index, GAD-7, and a combined initial
  wellness screening with scoring, severity bands, and saved results.
- **AI psychology companion** — chat with conversation history, retrieval of
  relevant passages from a psychology knowledge base (RAG), response
  guardrails, and risk/safety detection.
- **Mood tracking** — daily mood check-ins with history and trends.
- **Notifications** — in-app notifications for account and wellbeing events.
- **Professional directory** — browsable professional profiles and
  professional-facing profile pages.

### Present in the deployed app, not yet published in this repository

The public repository is a working subset of the project. The deployed
frontend also includes appointment booking/management and an admin console
(analytics, applications, content, knowledge base, reports). Their backend
routers and some migrations exist only in the local working copy and are not
tracked at the published commit, so those pages will not work from a fresh
clone. See [Repository scope](#repository-scope).

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS, React Router 6, Axios, Recharts |
| Backend | FastAPI, Uvicorn, SQLAlchemy 2, Alembic, Pydantic v2 / pydantic-settings |
| Data | SQLite (default), ChromaDB, LangChain document pipeline, `sentence-transformers/all-MiniLM-L6-v2` embeddings |
| AI | Mistral chat API, RAG over a local psychology knowledge base, safety/risk guardrails |
| Auth and mail | JWT (python-jose), Passlib/bcrypt, SMTP for verification and reset email |
| Hosting | Frontend on Vercel; backend and data on the developer's PC, exposed through a tunnel during demos |

## Repository scope

- Published branch: `deploy/frontend-v2`. This README lives there; if your
  clone checks out a different default branch, run
  `git checkout deploy/frontend-v2`.
- The backend at the published commit exposes `/auth`, `/users`,
  `/assessment`, `/chat`, `/mood`, `/notifications`, and `/professionals`.
  Appointment, journal, and admin endpoints are not published yet.
- Frontend pages for unpublished endpoints are still compiled into the build,
  so they may show errors when opened from a fresh clone.
- Local-only work in the developer's working copy is intentionally excluded
  from this repository and must not be assumed available after cloning.

## Run Mindora Locally

These steps run the full app on one machine. Windows PowerShell is shown
first; macOS/Linux equivalents are noted where they differ.

### 1. Prerequisites

- **Python 3.11** (the project virtualenv is built with 3.11.9)
- **Node.js 18 or newer** and npm
- **Git**
- Disk space and bandwidth for the Python ML dependencies
  (`torch`, `sentence-transformers`); the first run also downloads the
  embedding model.
- Optional: a Mistral API key for AI chat replies, and SMTP credentials for
  verification/reset email.

### 2. Clone the repository

```powershell
git clone https://github.com/Rayyan-Rizwan/mindora-ai.git
cd mindora-ai
git checkout deploy/frontend-v2
```

### 3. Create the backend virtual environment

The bundled launcher expects the environment at `backend\.venv`.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

If PowerShell blocks activation, allow scripts for the current session only:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### 4. Install backend dependencies

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 5. Configure backend environment

```powershell
Copy-Item .env.example .env
```

Then edit `backend\.env`. The example file contains placeholders only.

| Variable | Purpose | Local default |
| --- | --- | --- |
| `DATABASE_URL` | Database connection | `sqlite:///./sql_app.db` |
| `SECRET_KEY` | JWT signing key; must be unique and 32+ characters | placeholder in `.env.example` |
| `MISTRAL_API_KEY` | Enables AI chat responses | empty |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `EMAIL_FROM` | Verification and password-reset email | empty |
| `CORS_ORIGINS` | JSON array of allowed frontend origins | local dev origins |
| `FRONTEND_URL` | Frontend base URL used in emails/links | `http://localhost:5173` |
| `ENV` | `development` locally; `production` enables strict validation | `development` |

Generate a secret with:

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

Never commit `.env`; it is already ignored by Git.

### 6. Create the database

Run migrations from `backend` with the virtualenv active:

```powershell
alembic upgrade head
```

This creates `backend\sql_app.db` by default. Review migration files before
applying them to any database that holds data you care about.

### 7. Start the backend

Option A — project launcher (checks configuration, binds `127.0.0.1:8000`,
waits for health, records its PID and logs):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start_backend.ps1
```

Stop it with:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop_backend.ps1
```

Option B — run Uvicorn directly in the foreground:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Both options must be run from `backend`.

### 8. Build the knowledge base for RAG (first run only)

With the backend environment active and from `backend`:

```powershell
python -m app.rag.ingest
```

This reads the sample material in `backend\knowledge_base`, creates embeddings,
and stores chunks in `backend\chroma_db`. The app still starts without this
step, but chat retrieval will have no knowledge to draw from.

### 9. Start the frontend in a second terminal

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

`frontend\.env.example` sets `VITE_API_BASE_URL=http://localhost:8000/api/v1`.
The dev build also falls back to that URL if the variable is unset.

### 10. Verify the local setup

| Check | URL | Expected |
| --- | --- | --- |
| Frontend | http://localhost:5173 | Mindora home page |
| Health | http://127.0.0.1:8000/health | `{"status":"ok", ...}` |
| API docs (Swagger) | http://127.0.0.1:8000/docs | Interactive API schema |
| OpenAPI schema | http://127.0.0.1:8000/openapi.json | JSON schema |

PowerShell health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

All application endpoints are under the `/api/v1` prefix, for example
`http://localhost:8000/api/v1/auth/login`.

**How the frontend reaches the backend:** the dev server sends requests to
`VITE_API_BASE_URL` (default `http://localhost:8000/api/v1`) and permits
cross-origin calls from the origins listed in `CORS_ORIGINS`. A Vite dev proxy
from `/api` to `http://127.0.0.1:8000` is also configured for relative API
paths. Production builds fail closed unless `VITE_API_BASE_URL` is an absolute
HTTPS URL ending in `/api/v1`.

**Backend-dependent features:** registration/login, assessments, mood
tracking, notifications, the professional directory, and AI chat (which also
needs `MISTRAL_API_KEY`). Appointment and admin pages need the unpublished
backend modules described in [Repository scope](#repository-scope).

### 11. Stop everything

Press `Ctrl+C` in each terminal running `npm run dev` and Uvicorn. If you used
the launcher, also run `.\scripts\stop_backend.ps1`. Data persists in
`backend\sql_app.db` and `backend\chroma_db` between runs.

### Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| `python` not found | Install Python 3.11 and ensure it is on `PATH`, or use the `py -3.11` launcher. |
| `Activate.ps1 cannot be loaded` | Use the session-only execution policy command in step 3. |
| Port 8000 already in use | Stop the other process; the launcher refuses to start a second backend. |
| `ValidationError` about `CORS_ORIGINS` | Use the JSON array form from `.env.example`, not a comma-separated list. |
| Browser CORS error on login | Add `http://localhost:5173` to `CORS_ORIGINS` and restart the backend. |
| AI chat returns an error | Set `MISTRAL_API_KEY` in `backend\.env` and restart. |
| First chat is slow | The embedding model loads/downloads on first use. |
| Chat has no knowledge context | Run `python -m app.rag.ingest` from `backend`, then restart. |
| Email not received | Configure the SMTP variables; without them verification/reset mail cannot be delivered. |
| `no such table` database errors | Run `alembic upgrade head` from `backend`. |
| `npm run build` fails on API URL | Production builds require an absolute HTTPS `VITE_API_BASE_URL` ending in `/api/v1`. |

## Demo and tunnel notes

- The live frontend is static on Vercel, but its API is **not** permanently
  hosted. The backend runs on the developer's PC.
- Remote demos therefore require that PC to be awake, connected, and running
  the backend plus a tunnel (for example ngrok or an approved Cloudflare
  tunnel). Closing the laptop, restarting it, or dropping the connection takes
  API-dependent features offline.
- Tunnel addresses are deployment-specific and can change. No public tunnel
  URL, token, or credential belongs in this repository, issues, or screenshots.
- A local run (steps above) needs no tunnel. For a production build pointing at
  a tunnel, set `VITE_API_BASE_URL` to that HTTPS address plus `/api/v1` before
  building, and update `CORS_ORIGINS`/`FRONTEND_URL` on the backend.
- No uptime, persistence, or availability guarantee is made for the live demo.
  Treat the local setup as the reference environment.

## Security and data handling

- **Never commit** `.env` files, API keys, SMTP passwords, JWT secrets,
  databases, ChromaDB data, uploaded documents, logs, or real user data.
  `.env`, `*.db`, `backend/chroma_db/`, `backend/kb_admin/`, and
  `backend/system_content/` are ignored by Git.
- Committed `.env.example` files contain placeholders only. Put real values in
  your local `.env`.
- Do not reset, delete, or re-initialize a database that contains data you want
  to keep. Back up the database file (and `chroma_db`) before schema changes.
- Review every migration before applying it, especially against shared data.
- Do not paste real personal or clinical information into demos, issues, or
  screenshots.
- If a secret is exposed, rotate it immediately; removing it from a later
  commit does not remove it from Git history.
- Production mode (`ENV=production`) refuses weak secrets, wildcard CORS, and
  non-HTTPS `FRONTEND_URL`.

## Project structure

```
.
├── frontend/              React + TypeScript + Vite app
├── backend/
│   ├── app/               API routes, services, models, RAG pipeline
│   ├── alembic/           Database migrations
│   ├── knowledge_base/    Psychology reference material
│   ├── scripts/           Backend and tunnel launchers, preflight checks
│   └── requirements.txt
├── reports/               Project status report
└── README.md
```

## Status and limitations

- Final-year academic project, actively evolving; interfaces and behavior may
  change.
- The published repository is a subset of the local project (see
  [Repository scope](#repository-scope)).
- Live demo availability depends on the developer's PC and tunnel; it is not a
  permanent deployment.
- Email verification and password reset require working SMTP settings.
- AI output is generated, may be inaccurate, and is not a substitute for a
  qualified professional.
- Appointment booking, journaling, and admin functionality are present in the
  local/hosted app but their backend endpoints are not yet published.
- No guarantee of data durability; keep your own backups if you run the app
  with important data.
