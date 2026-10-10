
from app.database import SessionLocal
from app.services.motivational_notification_service import (
    process_motivational_notifications,
)

db = SessionLocal()

try:
    result = process_motivational_notifications(db)
    print("Processor result:", result)
    db.rollback()
    print("PASS: Test changes rolled back")
except Exception:
    db.rollback()
    raise
finally:
    db.close()
