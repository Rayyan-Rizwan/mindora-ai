from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.api.v1.deps import bearer_scheme, get_current_user
from app.core.security import decode_access_token
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserRegister, UserResponse
from app.services import auth_service
from app.services.email_verification_service import verify_email_token


router = APIRouter()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: UserRegister,
    db: Session = Depends(get_db),
):
    """
    Public registration.
    """
    user = auth_service.register_user(db, data)
    return user


@router.get("/verify-email")
def verify_email(
    token: str,
    db: Session = Depends(get_db),
):
    """
    Verify a user's email using the token sent during registration.
    """

    user = verify_email_token(db, token)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    return {
        "message": "Email verified successfully. You can now log in."
    }


@router.post("/login", response_model=TokenResponse)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    user = auth_service.authenticate_user(
        db,
        data.email,
        data.password,
    )

    token, expires_in = auth_service.issue_token_for_user(user)

    return TokenResponse(
        access_token=token,
        expires_in=expires_in,
    )


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
)
def logout(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Revoke the current JWT token server-side.
    """

    payload = decode_access_token(credentials.credentials)

    exp_timestamp = payload["exp"]

    expires_at = datetime.fromtimestamp(
        exp_timestamp,
        tz=timezone.utc,
    )

    auth_service.revoke_token(
        db,
        payload["jti"],
        expires_at,
    )

    return None