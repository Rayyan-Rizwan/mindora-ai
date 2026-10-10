"""
Mindora - Mental Health Risk Detection

Phase 10A + 10B:
- Deterministic risk detection
- Recent conversation context
- Negation handling
- Safety check-in context
- Risk escalation based on repeated concerning signals

This module is a safety screening layer.
It is NOT a clinical diagnosis or medical assessment.
"""

from enum import Enum


# =========================================================
# Risk Levels
# =========================================================

class RiskLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"


# =========================================================
# Risk Types
# =========================================================

class RiskType(str, Enum):
    NONE = "none"
    DISTRESS = "distress"
    SELF_HARM = "self_harm"
    SUICIDAL_IDEATION = "suicidal_ideation"
    SUICIDAL_INTENT = "suicidal_intent"
    UNKNOWN = "unknown"


# =========================================================
# High-Risk Signals
# =========================================================

HIGH_RISK_PATTERNS = {
    # Explicit suicidal intent
    "i want to kill myself",
    "i want to end my life",
    "i am going to kill myself",
    "i'm going to kill myself",
    "i am going to end my life",
    "i'm going to end my life",
    "i plan to kill myself",
    "i plan to end my life",
    "i will kill myself",
    "i'll kill myself",
    "i intend to kill myself",
    "i intend to end my life",

    # Explicit suicidal state
    "i am suicidal",
    "i'm suicidal",
    "i am thinking about suicide",
    "i'm thinking about suicide",
    "i am planning suicide",
    "i'm planning suicide",

    # Explicit desire not to live
    "i don't want to live anymore",
    "i dont want to live anymore",
    "i don't want to be alive anymore",
    "i dont want to be alive anymore",
    "i don't want to live",
    "i dont want to live",

    # Explicit immediate danger wording
    "i am going to hurt myself",
    "i'm going to hurt myself",
    "i am about to hurt myself",
    "i'm about to hurt myself",
}


# =========================================================
# Moderate-Risk Signals
# =========================================================

MODERATE_RISK_PATTERNS = {
    "i feel completely hopeless",
    "i feel hopeless",
    "i'm feeling hopeless",
    "i've been feeling hopeless",
    "i have been feeling hopeless",
    "feeling completely hopeless",
    "feeling hopeless",
    "completely hopeless",
    "hopeless",

    "i have no hope",
    "there is no hope",
    "nothing matters anymore",

    "life feels pointless",
    "my life feels pointless",
    "life is pointless",
    "my life is pointless",

    "i feel worthless",
    "i feel like a burden",
    "i am a burden",
    "i'm a burden",

    "everyone would be better without me",

    "i don't see a future",
    "i dont see a future",
    "i don't see any future",
    "i dont see any future",
    "i don't see a future for myself",
    "i dont see any future for myself",
    "i see no future",
    "i see no future for myself",
    "no future",

    "i can't do this anymore",
    "i cant do this anymore",
    "i cannot do this anymore",
    "i can't handle this anymore",
    "i cant handle this anymore",
    "i cannot handle this anymore",

    "i want to disappear",
    "i wish i could disappear",
    "i hate my life",

    "i feel completely empty",
    "i feel empty",
}


# =========================================================
# Self-Harm Signals
# =========================================================

SELF_HARM_PATTERNS = {
    "i want to hurt myself",
    "i want to harm myself",
    "i feel like hurting myself",
    "i feel like harming myself",
    "i want to self harm",
    "i want to self-harm",
    "i am self harming",
    "i'm self harming",
    "i am self-harming",
    "i'm self-harming",
}


# =========================================================
# Normalization
# =========================================================

def normalize_risk_text(text: str) -> str:
    """
    Normalize text for risk detection only.

    The original user message is never modified in the database.
    """

    if not text:
        return ""

    text = text.lower().strip()

    # Normalize apostrophe variants.
    text = text.replace("’", "'")
    text = text.replace("‘", "'")

    # Normalize common chat contractions.
    replacements = {
        "im ": "i'm ",
        "dont ": "don't ",
        "cant ": "can't ",
        "cannot ": "can't ",
        "wont ": "won't ",
        "isnt ": "isn't ",
        "doesnt ": "doesn't ",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    # Normalize punctuation.
    punctuation = ",.!?;:\"()[]{}"

    for character in punctuation:
        text = text.replace(character, " ")

    # Normalize whitespace.
    text = " ".join(text.split())

    return text


# =========================================================
# Negation Detection
# =========================================================

NEGATION_PATTERNS = {
    "i'm not suicidal",
    "im not suicidal",
    "i am not suicidal",
    "i'm not thinking about suicide",
    "i am not thinking about suicide",
    "i don't want to hurt myself",
    "i dont want to hurt myself",
    "i don't want to harm myself",
    "i dont want to harm myself",
    "i'm not going to hurt myself",
    "i am not going to hurt myself",
    "i'm not going to kill myself",
    "i am not going to kill myself",
}


def is_explicit_negation(text: str) -> bool:
    """
    Detect explicit statements denying self-harm/suicidal intent.

    This is intentionally conservative.
    """

    normalized = normalize_risk_text(text)

    return any(
        phrase in normalized
        for phrase in NEGATION_PATTERNS
    )


# =========================================================
# Direct Signal Detection
# =========================================================

def _contains_pattern(
    text: str,
    patterns: set[str],
) -> str | None:
    """
    Return the first matching pattern.
    """

    for pattern in patterns:
        if pattern in text:
            return pattern

    return None


def detect_direct_risk(text: str) -> dict:
    """
    Detect risk from the current message only.

    Returns a structured result.
    """

    normalized = normalize_risk_text(text)

    if not normalized:
        return {
            "level": RiskLevel.LOW.value,
            "is_risk": False,
            "risk_type": RiskType.NONE.value,
            "signals": [],
        }

    # Explicit negation must be considered before
    # broad phrase matching.
    if is_explicit_negation(normalized):
        return {
            "level": RiskLevel.LOW.value,
            "is_risk": False,
            "risk_type": RiskType.NONE.value,
            "signals": [],
        }

    # -----------------------------------------------------
    # HIGH
    # -----------------------------------------------------

    high_match = _contains_pattern(
        normalized,
        HIGH_RISK_PATTERNS,
    )

    if high_match:
        risk_type = (
            RiskType.SUICIDAL_INTENT.value
            if (
                "kill myself" in high_match
                or "end my life" in high_match
                or "suicide" in high_match
            )
            else RiskType.SELF_HARM.value
        )

        return {
            "level": RiskLevel.HIGH.value,
            "is_risk": True,
            "risk_type": risk_type,
            "signals": [high_match],
        }

    # -----------------------------------------------------
    # SELF-HARM
    # -----------------------------------------------------

    self_harm_match = _contains_pattern(
        normalized,
        SELF_HARM_PATTERNS,
    )

    if self_harm_match:
        return {
            "level": RiskLevel.MODERATE.value,
            "is_risk": True,
            "risk_type": RiskType.SELF_HARM.value,
            "signals": [self_harm_match],
        }

    # -----------------------------------------------------
    # MODERATE
    # -----------------------------------------------------

    moderate_match = _contains_pattern(
        normalized,
        MODERATE_RISK_PATTERNS,
    )

    if moderate_match:
        return {
            "level": RiskLevel.MODERATE.value,
            "is_risk": True,
            "risk_type": RiskType.DISTRESS.value,
            "signals": [moderate_match],
        }

    # -----------------------------------------------------
    # LOW
    # -----------------------------------------------------

    return {
        "level": RiskLevel.LOW.value,
        "is_risk": False,
        "risk_type": RiskType.NONE.value,
        "signals": [],
    }


# =========================================================
# Safety Check-In Context
# =========================================================

AFFIRMATIVE_RESPONSES = {
    "yes",
    "yeah",
    "yep",
    "yup",
    "yes i am",
    "i am",
    "i do",
    "correct",
    "that's right",
    "thats right",
}


SAFETY_CHECKIN_PATTERNS = {
    "are you thinking about hurting yourself",
    "are you thinking about harming yourself",
    "are you thinking about suicide",
    "are you suicidal",
    "do you want to hurt yourself",
    "do you want to harm yourself",
    "do you feel like hurting yourself",
}


def is_safety_checkin(message: str) -> bool:
    """
    Determine whether a message is a safety check-in question.
    """

    normalized = normalize_risk_text(message)

    return any(
        phrase in normalized
        for phrase in SAFETY_CHECKIN_PATTERNS
    )


def is_affirmative_response(message: str) -> bool:
    """
    Determine whether a short message is an affirmative response.
    """

    normalized = normalize_risk_text(message)

    return normalized in AFFIRMATIVE_RESPONSES


def detect_safety_checkin_response(
    current_message: str,
    previous_message: str | None,
) -> dict | None:
    """
    Detect an affirmative answer to a recent safety check-in.

    Example:

        Previous:
        "Are you thinking about hurting yourself?"

        Current:
        "yes"

    This should escalate to HIGH because the meaning comes
    from the conversation context.
    """

    if not previous_message:
        return None

    if not is_safety_checkin(previous_message):
        return None

    if not is_affirmative_response(current_message):
        return None

    return {
        "level": RiskLevel.HIGH.value,
        "is_risk": True,
        "risk_type": RiskType.SUICIDAL_IDEATION.value,
        "signals": [
            "affirmative_safety_checkin_response"
        ],
    }


# =========================================================
# Context-Based Escalation
# =========================================================

def count_moderate_signals(
    messages: list[str],
) -> int:
    """
    Count recent messages containing moderate-risk signals.
    """

    count = 0

    for message in messages:
        result = detect_direct_risk(message)

        if result["level"] == RiskLevel.MODERATE.value:
            count += 1

    return count


def detect_contextual_risk(
    current_message: str,
    recent_messages: list[str] | None = None,
) -> dict:
    """
    Detect risk using the current message plus recent context.

    Important behavior:
    - A HIGH-risk current message always returns HIGH.
    - A positive safety check-in response returns HIGH.
    - A previous HIGH-risk message alone does NOT force the
      current message to HIGH.
    - Repeated moderate-risk signals can return MODERATE.
    """

    recent_messages = recent_messages or []

    # -----------------------------------------------------
    # 1. Current message first
    # -----------------------------------------------------

    current_result = detect_direct_risk(current_message)

    if current_result["level"] == RiskLevel.HIGH.value:
        return current_result

    # -----------------------------------------------------
    # 2. Safety check-in context
    # -----------------------------------------------------

    if recent_messages:
        previous_message = recent_messages[-1]

        checkin_result = detect_safety_checkin_response(
            current_message=current_message,
            previous_message=previous_message,
        )

        if checkin_result:
            return checkin_result

    # -----------------------------------------------------
    # 3. Count MODERATE signals
    # -----------------------------------------------------

    all_recent_messages = [
        *recent_messages,
        current_message,
    ]

    moderate_count = count_moderate_signals(
        all_recent_messages
    )

    # Repeated moderate signals increase concern,
    # but do NOT automatically become HIGH.
    if moderate_count >= 2:
        return {
            "level": RiskLevel.MODERATE.value,
            "is_risk": True,
            "risk_type": RiskType.DISTRESS.value,
            "signals": [
                "repeated_moderate_distress"
            ],
        }

    # -----------------------------------------------------
    # 4. Return current result
    # -----------------------------------------------------

    return current_result