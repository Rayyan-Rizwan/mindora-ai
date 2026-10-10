from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.assessment import (
    AssessmentResponse,
    AssessmentResultResponse,
    AssessmentSubmitRequest,
)
from app.services import assessment_service


router = APIRouter(
    prefix="/assessment",
    tags=["Assessment"],
)


@router.get("/instruments")
def get_assessment_instruments(
    current_user: User = Depends(get_current_user),
):
    """
    Return the available mental-wellness screening instruments.
    """
    return assessment_service.get_instruments()


@router.post(
    "/start",
    response_model=AssessmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_assessment(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Start the complete initial mental-wellness assessment.

    The assessment contains:
    - WHO-5: 5 questions
    - GAD-7: 7 questions
    - Mood: 1 question
    - Stress: 1 question
    - Safety: 1 question

    Total: 15 questions.
    """

    assessment = assessment_service.create_assessment(
        db=db,
        user=current_user,
        assessment_type="initial_wellness",
    )

    return AssessmentResponse(
        assessment_id=assessment.id,
        assessment_type=assessment.assessment_type,
        status=assessment.status.value,
        questions=assessment_service.get_questions(
            assessment.assessment_type
        ),
    )

@router.post(
    "/{assessment_id}/submit",
    response_model=AssessmentResultResponse,
)
def submit_assessment(
    assessment_id: UUID,
    data: AssessmentSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit the completed screening assessment.
    """

    return assessment_service.submit_assessment(
        db=db,
        user=current_user,
        assessment_id=assessment_id,
        data=data,
    )
@router.get("/status")
def get_assessment_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return assessment_service.get_initial_assessment_status(
        db=db,
        user=current_user,
    )