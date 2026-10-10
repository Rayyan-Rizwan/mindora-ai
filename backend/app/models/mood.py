import uuid
from datetime import datetime, date

from sqlalchemy import (
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class MoodRecord(Base):
    __tablename__ = "mood_records"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    # Mood score from 1 to 10
    mood_score = Column(
        Integer,
        nullable=False
    )

    # Optional label such as "happy", "sad", "anxious"
    mood_label = Column(
        String(50),
        nullable=True
    )

    # Optional short note from the user
    note = Column(
        Text,
        nullable=True
    )

    # Calendar date of the mood check-in
    # This is used for the "one check-in per day" rule.
    mood_date = Column(
        Date,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    user = relationship(
        "User",
        back_populates="mood_records"
    )

    __table_args__ = (
        # Only allow mood scores from 1 to 10.
        CheckConstraint(
            "mood_score >= 1 AND mood_score <= 10",
            name="ck_mood_score_range"
        ),

        # A user can have only one mood check-in per calendar day.
        UniqueConstraint(
            "user_id",
            "mood_date",
            name="uq_mood_user_date"
        ),
    )