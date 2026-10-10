from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.token import RevokedToken
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.user import UserRegister
from app.services.email_service import send_verification_email
from app.services.email_verification_service import create_verification_token


def register_user(db: Session, data: UserRegister) -> User:
    existing = db.query(User).filter(User.email == data.email).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=UserRole.USER,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Create email verification token
    verification_token = create_verification_token(db, user)

    # Send verification email
    send_verification_email(
        email=user.email,
        verification_token=verification_token,
    )

    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email).first()

    # Same error for "no such user" and "wrong password"
    # so we don't reveal whether an email is registered.
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Check whether the account is active.
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    # Email verification is required before login.
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in",
        )

    return user


def issue_token_for_user(user: User) -> tuple[str, int]:
    token, _jti, expire_at = create_access_token(
        subject=str(user.id),
        role=user.role.value,
    )

    expires_in = int(
        (
            expire_at
            - datetime.utcnow().replace(tzinfo=expire_at.tzinfo)
        ).total_seconds()
    )

    return token, expires_in


def revoke_token(
    db: Session,
    jti: str,
    expires_at: datetime,
) -> None:
    # Prevent duplicate revoked-token records.
    if db.query(RevokedToken).filter(
        RevokedToken.jti == jti
    ).first():
        return

    db.add(
        RevokedToken(
            jti=jti,
            expires_at=expires_at,
        )
    )

    db.commit()


def is_token_revoked(db: Session, jti: str) -> bool:
    return (
        db.query(RevokedToken)
        .filter(RevokedToken.jti == jti)
        .first()
        is not None
    )
