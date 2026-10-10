from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.assessment import (
    Assessment,
    AssessmentAnswer,
    AssessmentResult,
)
from app.models.enums import AssessmentStatus
from app.models.user import User
from app.schemas.assessment import (
    AssessmentResultResponse,
    AssessmentSubmitRequest,
)
from app.services.assessment_instruments import (
    get_available_instruments,
    get_instrument,
)
from app.services.assessment_questions import (
    get_questions_for_instrument,
)
from app.services.assessment_scoring import (
    calculate_gad7_score,
    calculate_safety_result,
    calculate_short_section_score,
    calculate_who5_score,
)


def get_instruments():
    return get_available_instruments()


def create_assessment(
    db: Session,
    user: User,
    assessment_type: str,
) -> Assessment:

    try:
        get_instrument(assessment_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported assessment type: {assessment_type}",
        )

    assessment = Assessment(
        user_id=user.id,
        assessment_type=assessment_type,
        status=AssessmentStatus.IN_PROGRESS,
    )

    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return assessment


def get_questions(assessment_type: str):
    try:
        return get_questions_for_instrument(assessment_type)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


def submit_assessment(
    db: Session,
    user: User,
    assessment_id: UUID,
    data: AssessmentSubmitRequest,
) -> AssessmentResultResponse:

    # ---------------------------------------------------------
    # 1. Find assessment
    # ---------------------------------------------------------

    assessment = (
        db.query(Assessment)
        .filter(
            Assessment.id == assessment_id,
            Assessment.user_id == user.id,
        )
        .first()
    )

    if assessment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )

    if assessment.status == AssessmentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This assessment has already been completed",
        )

    # ---------------------------------------------------------
    # 2. Get expected questions
    # ---------------------------------------------------------

    try:
        expected_questions = get_questions_for_instrument(
            assessment.assessment_type
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    expected_codes = {
        question["code"]
        for question in expected_questions
    }

    submitted_codes = [
        answer.question_code
        for answer in data.answers
    ]

    # ---------------------------------------------------------
    # 3. Validate duplicate answers
    # ---------------------------------------------------------

    if len(submitted_codes) != len(set(submitted_codes)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate question answers are not allowed.",
        )

    # ---------------------------------------------------------
    # 4. Validate complete answer set
    # ---------------------------------------------------------

    if set(submitted_codes) != expected_codes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or incomplete question answers.",
        )

    # ---------------------------------------------------------
    # 5. Create question lookup
    # ---------------------------------------------------------

    question_lookup = {
        question["code"]: question["question"]
        for question in expected_questions
    }

    answers_by_code = {
        answer.question_code: answer.answer_value
        for answer in data.answers
    }

    # ---------------------------------------------------------
    # 6. Initial Wellness Assessment
    # ---------------------------------------------------------

    if assessment.assessment_type == "initial_wellness":

        # -------------------------
        # WHO-5
        # -------------------------

        who5_values = [
            answers_by_code[f"WHO5_Q{i}"]
            for i in range(1, 6)
        ]

        try:
            who5 = calculate_who5_score(who5_values)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            )

        # -------------------------
        # GAD-7
        # -------------------------

        gad7_values = [
            answers_by_code[f"GAD7_Q{i}"]
            for i in range(1, 8)
        ]

        try:
            gad7 = calculate_gad7_score(gad7_values)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            )

        # -------------------------
        # Mood
        # -------------------------

        mood_value = answers_by_code["MOOD_Q1"]

        try:
            mood = calculate_short_section_score(
                [mood_value]
            )
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            )

        # -------------------------
        # Stress
        # -------------------------

        stress_value = answers_by_code["STRESS_Q1"]

        try:
            stress = calculate_short_section_score(
                [stress_value]
            )
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            )

        # -------------------------
        # Safety
        # -------------------------

        safety_value = answers_by_code["SAFETY_Q1"]

        try:
            safety = calculate_safety_result(
                safety_value
            )
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            )

        # -----------------------------------------------------
        # Overall screening level
        # -----------------------------------------------------

        if safety["risk_flag"]:
            overall_level = "safety_concern"
            interpretation = (
                "Your responses indicate that additional safety "
                "support may be needed. This screening result is "
                "not a diagnosis. Please seek appropriate immediate "
                "support from a trusted person, qualified professional, "
                "or local emergency/crisis service."
            )

        elif (
            gad7["severity_level"] in {"moderate", "severe"}
            or mood["level"] == "elevated"
            or stress["level"] == "elevated"
            or who5["level"] == "lower_wellbeing"
        ):
            overall_level = "needs_attention"
            interpretation = (
                "Some areas of your responses suggest that your "
                "current wellbeing may benefit from additional attention. "
                "This is a screening indication, not a diagnosis. "
                "Consider supportive routines and, if these difficulties "
                "are affecting your daily life, talking with a qualified "
                "mental health professional."
            )

        else:
            overall_level = "generally_stable"
            interpretation = (
                "Your responses indicate generally stable wellbeing "
                "across the areas screened. This is not a diagnosis. "
                "Continue maintaining supportive routines, healthy "
                "relationships, rest, and activities that help you "
                "feel well."
            )

        # -----------------------------------------------------
        # Structured result
        # -----------------------------------------------------

        result_data = {
            "assessment_type": "initial_wellness",

            "who5": {
                "raw_score": who5["raw_score"],
                "percentage_score": who5["percentage_score"],
                "level": who5["level"],
            },

            "gad7": {
                "total_score": gad7["total_score"],
                "severity_level": gad7["severity_level"],
            },

            "mood": {
                "score": mood["total_score"],
                "percentage": mood["percentage"],
                "level": mood["level"],
            },

            "stress": {
                "score": stress["total_score"],
                "percentage": stress["percentage"],
                "level": stress["level"],
            },

            "safety": {
                "risk_flag": safety["risk_flag"],
            },

            "overall": {
                "level": overall_level,
            },
        }

        # Keep total_score for compatibility.
        # It represents the GAD-7 total here and is NOT
        # a combined score across different instruments.
        total_score = gad7["total_score"]

        severity_level = overall_level

    # ---------------------------------------------------------
    # WHO-5 standalone assessment
    # ---------------------------------------------------------

    elif assessment.assessment_type == "who5":

        answer_values = [
            answer.answer_value
            for answer in data.answers
        ]

        try:
            scoring = calculate_who5_score(answer_values)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            )

        total_score = scoring["raw_score"]
        severity_level = scoring["level"]

        interpretation = (
            "This result is a screening indication based on your "
            "responses and is not a medical diagnosis."
        )

        result_data = {
            "assessment_type": "who5",
            "who5": scoring,
        }

    # ---------------------------------------------------------
    # GAD-7 standalone assessment
    # ---------------------------------------------------------

    elif assessment.assessment_type == "gad7":

        answer_values = [
            answer.answer_value
            for answer in data.answers
        ]

        try:
            scoring = calculate_gad7_score(answer_values)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            )

        total_score = scoring["total_score"]
        severity_level = scoring["severity_level"]

        interpretation = (
            "This result is a screening indication based on your "
            "responses and is not a medical diagnosis. If these "
            "symptoms are affecting your daily life, consider discussing "
            "them with a qualified mental health professional."
        )

        result_data = {
            "assessment_type": "gad7",
            "gad7": scoring,
        }

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported assessment type",
        )

    # ---------------------------------------------------------
    # 7. Save individual answers
    # ---------------------------------------------------------

    for answer in data.answers:

        assessment_answer = AssessmentAnswer(
            assessment_id=assessment.id,
            question_code=answer.question_code,
            question_text=question_lookup[answer.question_code],
            answer_value=answer.answer_value,
        )

        db.add(assessment_answer)

    # ---------------------------------------------------------
    # 8. Complete assessment
    # ---------------------------------------------------------

    assessment.status = AssessmentStatus.COMPLETED
    assessment.completed_at = datetime.utcnow()

    # ---------------------------------------------------------
    # 9. Save result
    # ---------------------------------------------------------

    result = AssessmentResult(
        assessment_id=assessment.id,
        total_score=total_score,
        severity_level=severity_level,
        interpretation=interpretation,
        result_data=result_data,
    )

    db.add(result)
    db.commit()
    db.refresh(result)

    # ---------------------------------------------------------
    # 10. Return response
    # ---------------------------------------------------------

    return AssessmentResultResponse(
    assessment_id=assessment.id,
    total_score=result.total_score,
    severity_level=result.severity_level,
    interpretation=result.interpretation,
    result_data=result.result_data,
)

def get_initial_assessment_status(db: Session, user: User) -> dict:
    assessment = (
        db.query(Assessment)
        .filter(
            Assessment.user_id == user.id,
            Assessment.assessment_type == "initial_wellness",
            Assessment.status == AssessmentStatus.COMPLETED,
        )
        .order_by(Assessment.completed_at.desc())
        .first()
    )

    if assessment is None:
        return {
            "completed": False,
            "assessment_id": None,
            "assessment_type": "initial_wellness",
        }

    return {
        "completed": True,
        "assessment_id": assessment.id,
        "assessment_type": assessment.assessment_type,
    }