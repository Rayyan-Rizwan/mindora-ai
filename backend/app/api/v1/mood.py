from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.database import get_db
from app.models.mood import MoodRecord
from app.models.user import User
from app.schemas.mood import MoodCreateRequest, MoodResponse


router = APIRouter(
    prefix="/mood",
    tags=["Mood Tracking"],
)


@router.post(
    "",
    response_model=MoodResponse,
    status_code=status.HTTP_200_OK,
)
def save_mood(
    data: MoodCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create or update the current user's mood for today.

    Only one mood record is allowed per user per calendar day.
    If today's record already exists, it is updated instead of
    creating a duplicate.
    """

    today = date.today()

    mood_record = (
        db.query(MoodRecord)
        .filter(
            MoodRecord.user_id == current_user.id,
            MoodRecord.mood_date == today,
        )
        .first()
    )

    if mood_record:
        mood_record.mood_score = data.mood_score
        mood_record.note = data.note
        mood_record.updated_at = datetime.utcnow()
    else:
        mood_record = MoodRecord(
            user_id=current_user.id,
            mood_score=data.mood_score,
            note=data.note,
            mood_date=today,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        db.add(mood_record)

    db.commit()
    db.refresh(mood_record)

    return mood_record


@router.get(
    "/today",
    response_model=MoodResponse | None,
)
def get_today_mood(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return the current user's mood record for today.
    """

    today = date.today()

    mood_record = (
        db.query(MoodRecord)
        .filter(
            MoodRecord.user_id == current_user.id,
            MoodRecord.mood_date == today,
        )
        .first()
    )

    if mood_record is None:
        return None

    return mood_record


@router.get("/summary")
def get_mood_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return mood history and trend statistics.

    Includes:
    - Recent 30-day mood history
    - Current 7-day average
    - Previous 7-day average
    - Weekly comparison
    - Overall average
    - Current check-in streak
    - Missing days in the last 7 days
    """

    today = date.today()

    # ---------------------------------------------------------
    # Recent 30 days
    # ---------------------------------------------------------
    start_date = today - timedelta(days=29)

    mood_records = (
        db.query(MoodRecord)
        .filter(
            MoodRecord.user_id == current_user.id,
            MoodRecord.mood_date >= start_date,
            MoodRecord.mood_date <= today,
        )
        .order_by(MoodRecord.mood_date.asc())
        .all()
    )

    scores = [
        record.mood_score
        for record in mood_records
    ]

    average_mood = (
        round(sum(scores) / len(scores), 2)
        if scores
        else None
    )

    highest_mood = (
        max(scores)
        if scores
        else None
    )

    lowest_mood = (
        min(scores)
        if scores
        else None
    )

    # ---------------------------------------------------------
    # Current 7-day period
    # ---------------------------------------------------------
    current_week_start = today - timedelta(days=6)

    current_week_records = (
        db.query(MoodRecord)
        .filter(
            MoodRecord.user_id == current_user.id,
            MoodRecord.mood_date >= current_week_start,
            MoodRecord.mood_date <= today,
        )
        .all()
    )

    current_week_scores = [
        record.mood_score
        for record in current_week_records
    ]

    current_week_average = (
        round(
            sum(current_week_scores)
            / len(current_week_scores),
            2,
        )
        if current_week_scores
        else None
    )

    # ---------------------------------------------------------
    # Previous 7-day period
    # ---------------------------------------------------------
    previous_week_end = current_week_start - timedelta(days=1)
    previous_week_start = previous_week_end - timedelta(days=6)

    previous_week_records = (
        db.query(MoodRecord)
        .filter(
            MoodRecord.user_id == current_user.id,
            MoodRecord.mood_date >= previous_week_start,
            MoodRecord.mood_date <= previous_week_end,
        )
        .all()
    )

    previous_week_scores = [
        record.mood_score
        for record in previous_week_records
    ]

    previous_week_average = (
        round(
            sum(previous_week_scores)
            / len(previous_week_scores),
            2,
        )
        if previous_week_scores
        else None
    )

    # ---------------------------------------------------------
    # Weekly comparison
    # ---------------------------------------------------------
    weekly_change = None

    if (
        current_week_average is not None
        and previous_week_average is not None
    ):
        weekly_change = round(
            current_week_average - previous_week_average,
            2,
        )

    # ---------------------------------------------------------
    # Overall average
    # ---------------------------------------------------------
    all_records = (
        db.query(MoodRecord)
        .filter(
            MoodRecord.user_id == current_user.id
        )
        .all()
    )

    all_scores = [
        record.mood_score
        for record in all_records
    ]

    overall_average = (
        round(
            sum(all_scores) / len(all_scores),
            2,
        )
        if all_scores
        else None
    )

    # ---------------------------------------------------------
    # Current check-in streak
    # ---------------------------------------------------------
    mood_dates = {
        record.mood_date
        for record in all_records
    }

    streak = 0
    check_date = today

    while check_date in mood_dates:
        streak += 1
        check_date -= timedelta(days=1)

    # ---------------------------------------------------------
    # Missing days in current 7-day period
    # ---------------------------------------------------------
    current_week_dates = {
        record.mood_date
        for record in current_week_records
    }

    missing_days = 0

    for day_offset in range(7):
        check_date = today - timedelta(days=day_offset)

        if check_date not in current_week_dates:
            missing_days += 1

    # ---------------------------------------------------------
    # Response
    # ---------------------------------------------------------
    return {
        "period": {
            "start_date": start_date,
            "end_date": today,
        },
        "statistics": {
            "average_mood": average_mood,
            "highest_mood": highest_mood,
            "lowest_mood": lowest_mood,
            "total_check_ins": len(mood_records),
        },
        "trends": {
            "current_7_day_average": current_week_average,
            "previous_7_day_average": previous_week_average,
            "weekly_change": weekly_change,
            "overall_average": overall_average,
            "current_streak": streak,
            "missing_days_last_7_days": missing_days,
        },
        "moods": [
            {
                "date": record.mood_date,
                "score": record.mood_score,
            }
            for record in mood_records
        ],
    }