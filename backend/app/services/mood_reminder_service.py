
from datetime import date, datetime, time, timedelta
from app.models.notification import Notification
from uuid import UUID
from app.models.user import User
from sqlalchemy.orm import Session

from app.models.mood import MoodRecord
from app.models.enums import NotificationType
from app.services.notification_service import create_notification


def get_mood_reminder_status(
    db: Session,
    user_id: UUID,
) -> dict:
    """
    Check today's mood and determine whether a reminder is due.
    Low-mood follow-ups wait two hours after the latest submission.
    """
    today = date.today()

    today_mood = (
        db.query(MoodRecord)
        .filter(
            MoodRecord.user_id == user_id,
            MoodRecord.mood_date == today,
        )
        .first()
    )

    if today_mood is None:
        return {
            "should_remind": True,
            "reminder_type": "mood_reminder",
            "message": "How is your mood today?",
            "mood_submitted_today": False,
        }

    if today_mood.mood_score <= 3:
        mood_submitted_at = (
            today_mood.updated_at or today_mood.created_at
        )

        # Wait two hours after the latest mood submission/update.
        if (
            mood_submitted_at is None
            or datetime.utcnow() - mood_submitted_at
            < timedelta(hours=2)
        ):
            return {
                "should_remind": False,
                "reminder_type": None,
                "message": None,
                "mood_submitted_today": True,
                "mood_score": today_mood.mood_score,
                "followup_pending": True,
            }

        return {
            "should_remind": True,
            "reminder_type": "low_mood_followup",
            "message": "How are you feeling now?",
            "mood_submitted_today": True,
            "mood_score": today_mood.mood_score,
        }

    return {
        "should_remind": False,
        "reminder_type": None,
        "message": None,
        "mood_submitted_today": True,
    }

def create_mood_reminder_if_needed(
    db: Session,
    user_id: UUID,
):
    """Create at most one notification of each mood reminder type per day."""

    status = get_mood_reminder_status(db, user_id)

    if not status["should_remind"]:
        return None

    notification_type = NotificationType(
        status["reminder_type"]
    )

    today = date.today()
    start_of_day = datetime.combine(today, time.min)
    start_of_tomorrow = datetime.combine(
        today + timedelta(days=1),
        time.min,
    )

    existing_notification = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.type == notification_type,
            Notification.created_at >= start_of_day,
            Notification.created_at < start_of_tomorrow,
        )
        .first()
    )

    if existing_notification is not None:
        return None

    return create_notification(
        db=db,
        user_id=user_id,
        notification_type=notification_type,
        title=(
            "Mood Check-in"
            if notification_type == NotificationType.MOOD_REMINDER
            else "Mood Follow-up"
        ),
        content=status["message"],
    )


def process_due_reminders(
    db: Session,
    user_id: UUID | None = None,
) -> dict[str, int]:
    """
    Process due mood reminders.

    Pass user_id to process one user during an in-app request.
    Omit user_id to process all active users from a scheduled worker.

    The caller is responsible for committing the transaction.
    """
    users_query = db.query(User).filter(
        User.is_active.is_(True)
    )

    if user_id is not None:
        users_query = users_query.filter(
            User.id == user_id
        )

    users = users_query.all()
    notifications_created = 0

    for user in users:
        notification = create_mood_reminder_if_needed(
            db=db,
            user_id=user.id,
        )

        if notification is not None:
            notifications_created += 1

    return {
        "users_checked": len(users),
        "notifications_created": notifications_created,
    }