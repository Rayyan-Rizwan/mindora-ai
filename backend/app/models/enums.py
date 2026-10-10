import enum


class UserRole(str, enum.Enum):
    USER = "user"
    PROFESSIONAL = "professional"
    ADMIN = "admin"


class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class SessionType(str, enum.Enum):
    TEXT = "text"
    VOICE = "voice"


class ConversationStatus(str, enum.Enum):
    ACTIVE = "active"
    ENDED = "ended"


class SenderType(str, enum.Enum):
    USER = "user"
    AI = "ai"


class AssessmentStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class AppointmentType(str, enum.Enum):
    CHAT = "chat"
    AUDIO = "audio"
    VIDEO = "video"


class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class NotificationType(str, enum.Enum):
    SYSTEM = "system"
    APPOINTMENT = "appointment"
    ASSESSMENT_REMINDER = "assessment_reminder"
    RISK_ALERT = "risk_alert"
    MESSAGE = "message"

    MOTIVATIONAL = "motivational"
    MOOD_REMINDER = "mood_reminder"
    LOW_MOOD_FOLLOWUP = "low_mood_followup"
    AI_CHECK_IN = "ai_check_in"