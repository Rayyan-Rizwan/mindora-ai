# Phase 4 — Database Implementation

100% free stack: **PostgreSQL** (local or free-tier) + **SQLAlchemy** + **Alembic**. No paid services required.

## Tables created

| Table | Purpose |
|---|---|
| `users` | Core auth table (patients, professionals, admins) |
| `profiles` | Extra personal info for any user |
| `professionals` | Extra info for users with role = professional (license, specialization) |
| `conversations` | A chat/voice session between a user and the AI |
| `messages` | Individual messages inside a conversation |
| `assessments` | An instance of a user taking a screening tool (PHQ-9, GAD-7, etc.) |
| `assessment_answers` | Individual question/answer pairs for an assessment |
| `assessment_results` | Computed score + severity for a completed assessment |
| `mood_records` | Daily mood check-ins |
| `journal_entries` | Free-form journal entries |
| `appointments` | Booked slot between patient and professional |
| `consultations` | Actual notes/outcome record tied to a completed appointment |
| `notifications` | In-app notifications for any user |

See `erd-design.md` (shared earlier) for the full relationship diagram — table/column names here match that design, renamed to match your Phase 4 spec.

## Setup (all free)

### 1. Install PostgreSQL (free)
- **Local**: install PostgreSQL directly, or run it in Docker:
  ```bash
  docker run --name pg-wellness -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
  ```
- **Free-tier hosted** (no local install needed): [Neon](https://neon.tech) or [Supabase](https://supabase.com) both have free Postgres tiers — just copy the connection string they give you.

### 2. Create the database
```bash
# if running Postgres locally:
createdb mental_wellness
```

### 3. Python environment
```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Configure environment
```bash
cp .env.example .env
# edit .env and set DATABASE_URL to your local or free-tier Postgres URL
```

### 5. Generate and run the first migration
```bash
alembic revision --autogenerate -m "create initial tables"
alembic upgrade head
```

This will create all 13 tables in your PostgreSQL database, with correct foreign keys, enums, and cascade rules.

### 6. Verify
```bash
psql mental_wellness -c "\dt"
```
You should see all 13 tables listed.

## Notes

- All IDs are UUIDs (not sequential integers) — safer for a health-data app.
- Cascade deletes are set up (e.g. deleting a user removes their profile, conversations, etc.) — review whether you actually want hard deletes before going to production; soft deletes may be safer for compliance.
- `risk_flags`, `rag_documents`/`rag_chunks`, and `audit_logs` from the original ERD are **not** in this phase since they weren't in your Phase 4 table list — they'll come in the Risk Detection and RAG phases.
