"""
Mindora - Safety Response Service

Provides deterministic, supportive responses for detected
mental-health risk levels.

This service does NOT diagnose the user.
"""

from app.services.risk_detection_service import RiskLevel, RiskType


def build_high_risk_response(risk_type: str) -> str:
    """
    Response for high-risk situations.
    """

    if risk_type in {
        RiskType.SUICIDAL_INTENT.value,
        RiskType.SUICIDAL_IDEATION.value,
        RiskType.SELF_HARM.value,
    }:
        return (
            "I'm really sorry you're going through this. "
            "If you feel you might hurt yourself or you're in immediate danger, "
            "please contact your local emergency service or go to the nearest "
            "emergency department now. If possible, stay with someone you trust "
            "and move away from anything you could use to hurt yourself."
        )

    return (
        "I'm concerned about what you're going through. "
        "If you feel you might hurt yourself or you're in immediate danger, "
        "please contact your local emergency service or go to the nearest "
        "emergency department now. If possible, stay with someone you trust."
    )


def build_moderate_risk_response() -> str:
    """
    Response for moderate emotional distress.
    """

    return (
        "It sounds like you're going through a really difficult time. "
        "You don't have to handle everything alone. "
        "Would you like to tell me a little more about what's been feeling hardest?"
    )


def build_safety_response(risk_result: dict) -> str | None:
    """
    Build a response based on the detected risk level.

    Returns None for LOW risk so the normal chatbot flow can continue.
    """

    level = risk_result.get("level", RiskLevel.LOW.value)
    risk_type = risk_result.get(
        "risk_type",
        RiskType.NONE.value,
    )

    if level == RiskLevel.HIGH.value:
        return build_high_risk_response(risk_type)

    if level == RiskLevel.MODERATE.value:
        return build_moderate_risk_response()

    return None