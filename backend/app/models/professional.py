import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, Numeric, String, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Professional(Base):
    """Extended profile for users with role = PROFESSIONAL (doctor/psychologist/counselor)."""

    __tablename__ = "professionals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    license_number = Column(String(100), unique=True, nullable=False)
    specialization = Column(String(150), nullable=False)
    bio = Column(Text, nullable=True)
    years_experience = Column(Integer, default=0)
    is_verified = Column(Boolean, default=False, nullable=False)
    consultation_fee = Column(Numeric(10, 2), default=0)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="professional_profile")
    appointments = relationship("Appointment", back_populates="professional", cascade="all, delete-orphan")
    consultations = relationship("Consultation", back_populates="professional", cascade="all, delete-orphan")
