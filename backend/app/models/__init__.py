from app.database import Base  # noqa: F401
from app.models.email_verification import EmailVerificationToken


# Import every model so Base.metadata knows about all tables
# (required for Alembic's autogenerate to detect them).
from app.models.user import User  # noqa: F401
from app.models.profile import Profile  # noqa: F401
from app.models.professional import Professional  # noqa: F401
from app.models.conversation import Conversation  # noqa: F401
from app.models.message import Message  # noqa: F401
from app.models.assessment import Assessment, AssessmentAnswer, AssessmentResult  # noqa: F401
from app.models.mood import MoodRecord  # noqa: F401
from app.models.journal import JournalEntry  # noqa: F401
from app.models.appointment import Appointment  # noqa: F401
from app.models.consultation import Consultation  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.token import RevokedToken  # noqa: F401

__all__ = [
    "Base",
    "User",
    "Profile",
    "Professional",
    "Conversation",
    "Message",
    "Assessment",
    "AssessmentAnswer",
    "AssessmentResult",
    "MoodRecord",
    "JournalEntry",
    "Appointment",
    "Consultation",
    "Notification",
    "RevokedToken",
]