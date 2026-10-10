import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------- Password hashing ----------

def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ---------- JWT ----------

def create_access_token(subject: str, role: str, expires_minutes: Optional[int] = None) -> tuple[str, str, datetime]:
    """
    Returns (token, jti, expires_at).
    `jti` (JWT ID) is a unique identifier for this specific token, used to support
    logout/revocation even though JWTs are otherwise stateless.
    """
    expire_minutes = expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    expire_at = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
    jti = str(uuid.uuid4())

    payload = {
        "sub": subject,       # user id
        "role": role,
        "jti": jti,
        "exp": expire_at,
        "iat": datetime.now(timezone.utc),
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, jti, expire_at


def decode_access_token(token: str) -> dict:
    """Raises JWTError if invalid or expired — caller should catch this."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


__all__ = ["hash_password", "verify_password", "create_access_token", "decode_access_token", "JWTError"]
