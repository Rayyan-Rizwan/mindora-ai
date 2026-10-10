# AI Mental Wellness Platform

100% free/open-source stack: React + TypeScript (Vite) frontend, FastAPI + PostgreSQL backend.

## Project structure

```
.
├── .gitignore
├── frontend/          → React + TypeScript (Vite)
└── backend/           → FastAPI + SQLAlchemy + Alembic
```

See `frontend/README.md` (if added) and `backend/README.md` for stack-specific setup.

## Git & GitHub setup

### 1. Initialize Git (run once, at project root)
```bash
git init
git add .
git commit -m "Initial project structure: frontend + backend scaffold"
```

### 2. Create a GitHub repository
- Go to github.com → New repository → **do not** initialize with a README (you already have one)
- Copy the repository URL it gives you

### 3. Connect and push
```bash
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git branch -M main
git push -u origin main
```

## Environment variables — critical rule

**API keys and secrets must NEVER be committed to source code or Git.**

- Each part of the project has a `.env.example` file — this IS committed, and shows what variables are needed, with no real values.
- Copy it to a real `.env` file locally (`cp .env.example .env`) and fill in real values there.
- `.env` is already listed in `.gitignore` at the root, so it will never be committed — verify with `git status` that `.env` never shows up as a tracked file.
- If a secret is ever accidentally committed, rotate/regenerate that key immediately — removing it from a later commit does not remove it from Git history.

## Running both apps locally

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then edit DATABASE_URL
alembic upgrade head
uvicorn app.main:app --reload
```
Backend runs at `http://localhost:8000`.

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Frontend runs at `http://localhost:5173`.
