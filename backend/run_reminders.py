
import logging
from datetime import datetime, time
from zoneinfo import ZoneInfo

from app.database import SessionLocal
from app.services.mood_reminder_service import process_due_reminders
from app.services.motivational_notification_service import (
    process_motivational_notifications,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)

PAKISTAN_TIMEZONE = ZoneInfo("Asia/Karachi")
MOTIVATIONAL_START = time(9, 0)
MOTIVATIONAL_END = time(11, 0)


def main():
    db = SessionLocal()

    try:
        # Always process existing mood reminders and due follow-ups.
        mood_result = process_due_reminders(db)

        # Send motivational notifications only during the morning window.
        local_time = datetime.now(PAKISTAN_TIMEZONE).time().replace(
            tzinfo=None
        )

        motivational_result = {
            "users_checked": 0,
            "notifications_created": 0,
            "skipped_outside_morning_window": False,
        }

        if MOTIVATIONAL_START <= local_time < MOTIVATIONAL_END:
            motivational_result = process_motivational_notifications(db)
        else:
            motivational_result["skipped_outside_morning_window"] = True

        db.commit()

        logging.info("Mood reminder processing completed: %s", mood_result)
        logging.info(
            "Motivational notification processing completed: %s",
            motivational_result,
        )

    except Exception:
        db.rollback()
        logging.exception("Reminder processing failed")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
