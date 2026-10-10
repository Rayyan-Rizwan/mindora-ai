
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.enums import NotificationType
from app.models.notification import Notification


def create_notification(
    db: Session,
    user_id: UUID,
    notification_type: NotificationType,
    title: str,
    content: str | None = None,
) -> Notification:
    """Create an in-app notification without committing the transaction."""
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        content=content,
        is_read=False,
    )

    db.add(notification)
    db.flush()

    return notification