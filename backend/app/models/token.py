from datetime import datetime

from sqlalchemy import Column, DateTime, String

from app.database import Base


class RevokedToken(Base):
    """
    Stores the jti (JWT ID) of any token that has been logged out / revoked,
    so it can be rejected even though it hasn't technically expired yet.
    A periodic cleanup job can later delete rows where expires_at < now().
    """

    __tablename__ = "revoked_tokens"

    jti = Column(String(36), primary_key=True)
    revoked_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
