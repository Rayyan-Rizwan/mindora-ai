
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, require_role
from app.database import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.user import UserProfileUpdate, UserResponse

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    """Any authenticated user can view their own profile."""
    return current_user


@router.get("/me/setup-status")
def get_my_setup_status(
    current_user: User = Depends(get_current_user),
):
    """
    Return whether the authenticated user's profile setup
    has been completed.
    """

    return {
        "profile_completed": current_user.profile is not None,
    }


@router.put("/me", response_model=UserResponse)
def update_my_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.full_name is not None:
        current_user.full_name = data.full_name

    if current_user.profile is None:
        from app.models.profile import Profile

        current_user.profile = Profile(
            user_id=current_user.id
        )

    if data.phone is not None:
        current_user.profile.phone = data.phone

    if data.timezone is not None:
        current_user.profile.timezone = data.timezone

    db.commit()
    db.refresh(current_user)

    return current_user


@router.get(
    "/",
    response_model=List[UserResponse],
    dependencies=[
        Depends(require_role(UserRole.ADMIN))
    ],
)
def list_all_users(
    db: Session = Depends(get_db),
):
    """Admin-only user listing."""
    return db.query(User).all()
