from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import UserRole


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=150)
    # Role is optional on register; defaults to USER. Only an existing ADMIN
    # should be able to create PROFESSIONAL/ADMIN accounts (enforced in the route).
    role: UserRole = UserRole.USER


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: UserRole
    is_verified: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True  # allows returning this directly from a SQLAlchemy object


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    phone: Optional[str] = Field(default=None, max_length=20)
    timezone: Optional[str] = None
