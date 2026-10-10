
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import NotificationType


class NotificationResponse(BaseModel):
    id: UUID
    type: NotificationType
    title: str
    content: str | None = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)