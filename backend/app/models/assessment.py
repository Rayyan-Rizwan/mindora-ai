import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import AssessmentStatus


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    assessment_type = Column(String(50), nullable=False)

    status = Column(
        Enum(AssessmentStatus),
        default=AssessmentStatus.IN_PROGRESS,
        nullable=False,
    )

    started_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="assessments")

    answers = relationship(
        "AssessmentAnswer",
        back_populates="assessment",
        cascade="all, delete-orphan",
    )

    result = relationship(
        "AssessmentResult",
        back_populates="assessment",
        uselist=False,
        cascade="all, delete-orphan",
    )

class AssessmentAnswer(Base):
    __tablename__ = "assessment_answers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    assessment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("assessments.id", ondelete="CASCADE"),
        nullable=False,
    )

    question_code = Column(String(50), nullable=False)
    question_text = Column(Text, nullable=False)
    answer_value = Column(Integer, nullable=False)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    assessment = relationship(
        "Assessment",
        back_populates="answers",
    )

class AssessmentResult(Base):
    __tablename__ = "assessment_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    assessment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("assessments.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    # Kept for compatibility / overall reference
    total_score = Column(Integer, nullable=False)

    # Overall screening level
    severity_level = Column(String(50), nullable=False)

    # Human-readable interpretation
    interpretation = Column(Text, nullable=True)

    # Structured results for WHO-5, GAD-7,
    # mood, stress and safety screening
    result_data = Column(JSON, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    assessment = relationship(
        "Assessment",
        back_populates="result",
    )