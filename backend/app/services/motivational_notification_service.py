
from datetime import date, datetime, time, timedelta
from uuid import UUID
from app.models.user import User

from sqlalchemy.orm import Session

from app.models.enums import NotificationType
from app.models.notification import Notification
from app.services.notification_service import create_notification
from app.services.motivational_message_service import get_motivational_message


def create_motivational_notification_if_needed(
    db: Session,
    user_id: UUID,
) -> Notification | None:
    """Create at most one motivational notification per user per day."""

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
            Notification.type == NotificationType.MOTIVATIONAL,
            Notification.created_at >= start_of_day,
            Notification.created_at < start_of_tomorrow,
        )
        .first()
    )

    if existing_notification is not None:
        return None

    title, message = get_motivational_message()

    return create_notification(
        db=db,
        user_id=user_id,
        notification_type=NotificationType.MOTIVATIONAL,
        title=title,
        content=message,
    )



def process_motivational_notifications(db: Session) -> dict[str, int]:
    """Process daily motivational notifications for active users."""

    users = db.query(User).filter(User.is_active.is_(True)).all()

    notifications_created = 0

    for user in users:
        notification = create_motivational_notification_if_needed(
            db=db,
            user_id=user.id,
        )

        if notification is not None:
            notifications_created += 1

    return {
        "users_checked": len(users),
        "notifications_created": notifications_created,
    }
