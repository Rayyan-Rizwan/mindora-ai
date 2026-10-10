# API v1 routes

Each feature gets its own router file here, e.g.:
- auth.py       -> /api/v1/auth/...
- users.py      -> /api/v1/users/...
- conversations.py
- assessments.py
- mood.py
- journal.py
- appointments.py

Register each router in app/main.py with app.include_router(...).
