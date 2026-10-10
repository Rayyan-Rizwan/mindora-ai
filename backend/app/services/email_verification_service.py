import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.email_verification import EmailVerificationToken
from app.models.user import User


VERIFICATION_TOKEN_EXPIRE_MINUTES = 30


def _hash_token(token: str) -> str:
    """
    Hash the raw verification token before storing it in the database.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_verification_token(
    db: Session,
    user: User,
) -> str:
    """
    Create a secure email verification token.

    Only the hash is stored in the database.
    The raw token is returned so it can be sent by email.
    """

    # Invalidate any previous unused tokens for this user
    db.query(EmailVerificationToken).filter(
        EmailVerificationToken.user_id == user.id,
        EmailVerificationToken.used.is_(False),
    ).update(
        {"used": True},
        synchronize_session=False,
    )

    # Generate a cryptographically secure random token
    raw_token = secrets.token_urlsafe(32)

    # Store only the hash
    token_hash = _hash_token(raw_token)

    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=VERIFICATION_TOKEN_EXPIRE_MINUTES
    )

    verification_token = EmailVerificationToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        used=False,
    )

    db.add(verification_token)
    db.commit()
    db.refresh(verification_token)

    return raw_token


def verify_email_token(
    db: Session,
    raw_token: str,
) -> User | None:
    """
    Validate an email verification token.

    Returns the verified User on success.
    Returns None if the token is invalid, expired, or already used.
    """

    token_hash = _hash_token(raw_token)

    verification_token = (
        db.query(EmailVerificationToken)
        .filter(
            EmailVerificationToken.token_hash == token_hash,
            EmailVerificationToken.used.is_(False),
        )
        .first()
    )

    if verification_token is None:
        return None

    # Make expiration comparison timezone-safe
    now = datetime.now(timezone.utc)

    expires_at = verification_token.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now:
        verification_token.used = True
        db.commit()
        return None

    user = db.query(User).filter(
        User.id == verification_token.user_id
    ).first()

    if user is None:
        return None

    # Mark token as used
    verification_token.used = True

    # Verify the user's email
    user.is_verified = True

    db.commit()
    db.refresh(user)

    return user