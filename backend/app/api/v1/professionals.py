from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.professional import Professional
from app.models.user import User
from app.schemas.professional import ProfessionalPublicResponse


router = APIRouter()


@router.get("", response_model=list[ProfessionalPublicResponse])
def list_professionals(db: Session = Depends(get_db)):
    """
    Return only verified professionals linked to active,
    email-verified professional accounts.
    """
    professionals = (
        db.query(Professional)
        .join(User, Professional.user_id == User.id)
        .filter(
            Professional.is_verified.is_(True),
            User.role == "professional",
            User.is_active.is_(True),
            User.is_verified.is_(True),
        )
        .order_by(Professional.specialization, User.full_name)
        .all()
    )

    return [
        {
            "id": professional.id,
            "full_name": professional.user.full_name,
            "specialization": professional.specialization,
            "bio": professional.bio,
            "years_experience": professional.years_experience or 0,
            "consultation_fee": professional.consultation_fee or 0,
        }
        for professional in professionals
    ]