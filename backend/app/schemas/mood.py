from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class MoodCreateRequest(BaseModel):
    mood_score: int = Field(
        ...,
        ge=1,
        le=10,
        description="Mood score from 1 to 10"
    )
    note: Optional[str] = Field(
        None,
        max_length=500,
        description="Optional short mood note"
    )


class MoodResponse(BaseModel):
    id: UUID
    mood_score: int
    mood_label: Optional[str] = None
    note: Optional[str] = None
    mood_date: date
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        