# Services

Business logic lives here, not in route handlers. Example: auth_service.py,
assessment_service.py (scoring logic), risk_service.py (risk detection rules).
Routes in app/api/ call these services; services talk to app/models/ via the DB session.
