from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProfessionalPublicResponse(BaseModel):
    id: UUID
    full_name: str
    specialization: str
    bio: Optional[str] = None
    years_experience: int = Field(ge=0)
    consultation_fee: Decimal

    model_config = ConfigDict(from_attributes=True)