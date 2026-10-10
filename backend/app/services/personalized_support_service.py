from typing import Any


# ---------------------------------------------------------
# PERSONALIZED SUPPORT CATEGORIES
# ---------------------------------------------------------

BREATHING_EXERCISE = "breathing_exercise"
GROUNDING_EXERCISE = "grounding_exercise"
JOURNALING = "journaling"
PROFESSIONAL_SUPPORT = "professional_support"


# ---------------------------------------------------------
# SAFETY GATE
# ---------------------------------------------------------

def safety_gate(
    risk_result: dict | None,
) -> str | None:
    """
    Safety gate for personalized support.

    HIGH or MODERATE risk must never be replaced by a
    normal personalized recommendation.

    Phase 10 remains responsible for generating the actual
    safety response. This function only tells Phase 11
    whether personalization must be blocked.
    """

    if not risk_result:
        return None

    level = risk_result.get("level", "low")

    if level in {"high", "moderate"}:
        return "safety_response"

    return None


# ---------------------------------------------------------
# WEIGHTED SCORING
# ---------------------------------------------------------

def score_categories(
    signals: dict[str, Any],
) -> dict[str, int]:
    """
    Calculate weighted personalized-support scores.

    These scores are recommendation signals only.
    They are NOT clinical scores and must never be treated
    as a diagnosis.
    """

    scores = {
        BREATHING_EXERCISE: 0,
        GROUNDING_EXERCISE: 0,
        JOURNALING: 0,
        PROFESSIONAL_SUPPORT: 0,
    }

    # -----------------------------------------------------
    # Emotion / sentiment signal
    # -----------------------------------------------------

    sentiment = signals.get("sentiment")

    if sentiment is not None:
        if sentiment < -0.5:
            scores[GROUNDING_EXERCISE] += 3

        elif sentiment < -0.2:
            scores[GROUNDING_EXERCISE] += 1

    # -----------------------------------------------------
    # Current emotion signal
    # -----------------------------------------------------

    emotion = str(
        signals.get("emotion") or ""
    ).lower()

    if emotion in {
        "fear",
        "anxiety",
        "nervousness",
    }:
        scores[BREATHING_EXERCISE] += 3

    if emotion in {
        "sadness",
        "anger",
        "fear",
        "disgust",
    }:
        scores[GROUNDING_EXERCISE] += 2

    # -----------------------------------------------------
    # Assessment context
    # -----------------------------------------------------

    assessment = signals.get(
        "assessment_context"
    ) or {}

    anxiety = assessment.get("anxiety")
    mood = assessment.get("mood")
    stress = assessment.get("stress")
    wellbeing = assessment.get("wellbeing")
    overall = assessment.get("overall")

    # Anxiety screening
    if anxiety in {
        "moderate",
        "severe",
    }:
        scores[BREATHING_EXERCISE] += 2
        scores[PROFESSIONAL_SUPPORT] += 2

    elif anxiety == "mild":
        scores[BREATHING_EXERCISE] += 1

    # Mood screening
    if mood == "elevated":
        scores[GROUNDING_EXERCISE] += 2
        scores[JOURNALING] += 1

    # Stress screening
    if stress == "elevated":
        scores[BREATHING_EXERCISE] += 2
        scores[GROUNDING_EXERCISE] += 1

    # Lower wellbeing
    if wellbeing == "lower_wellbeing":
        scores[JOURNALING] += 2
        scores[PROFESSIONAL_SUPPORT] += 1

    # Overall screening result
    if overall == "needs_attention":
        scores[PROFESSIONAL_SUPPORT] += 2

    # Safety flag from assessment
    #
    # This does NOT generate the safety response.
    # Phase 10 handles current conversational risk.
    #
    # We simply make professional support the strongest
    # recommendation when the stored screening indicates
    # a safety concern.
    if assessment.get("safety_flag") is True:
        scores[PROFESSIONAL_SUPPORT] += 5

    # -----------------------------------------------------
    # Mood history
    # -----------------------------------------------------

    mood_history = signals.get(
        "mood_history"
    ) or []

    valid_moods = [
        value
        for value in mood_history
        if isinstance(value, (int, float))
    ]

    if valid_moods:
        average_mood = (
            sum(valid_moods) / len(valid_moods)
        )

        if average_mood <= 4:
            scores[GROUNDING_EXERCISE] += 2
            scores[JOURNALING] += 2

        elif average_mood <= 6:
            scores[JOURNALING] += 1

    # -----------------------------------------------------
    # Preferences
    # -----------------------------------------------------

    preferences = signals.get(
        "preferences"
    ) or []

    preferences = {
        str(item).lower()
        for item in preferences
    }

    if "breathing" in preferences:
        scores[BREATHING_EXERCISE] += 2

    if "grounding" in preferences:
        scores[GROUNDING_EXERCISE] += 2

    if "journaling" in preferences:
        scores[JOURNALING] += 2

    if "professional_support" in preferences:
        scores[PROFESSIONAL_SUPPORT] += 2

    return scores


# ---------------------------------------------------------
# RECOMMENDATION DECISION
# ---------------------------------------------------------

def decide_recommendation(
    signals: dict[str, Any],
) -> tuple[str, dict[str, int]]:
    """
    Select the highest-scoring support category.

    Returns:
        category, scores
    """

    scores = score_categories(signals)

    best_category = max(
        scores,
        key=scores.get,
    )

    return best_category, scores


# ---------------------------------------------------------
# STRUCTURED SUPPORT OBJECT
# ---------------------------------------------------------

def build_support_recommendation(
    signals: dict[str, Any],
) -> dict[str, Any]:
    """
    Build a structured personalized-support recommendation.

    This function does not generate a diagnosis and does not
    generate the final user-facing response.
    """

    # -----------------------------------------------------
    # Safety gate
    # -----------------------------------------------------

    safety_result = safety_gate(
        signals.get("risk_result")
    )

    if safety_result is not None:
        return {
            "blocked": True,
            "category": safety_result,
            "scores": {},
            "reason": (
                "Personalized support is blocked because "
                "the existing safety system requires its "
                "response to take priority."
            ),
        }

    # -----------------------------------------------------
    # Weighted recommendation
    # -----------------------------------------------------

    category, scores = decide_recommendation(
        signals
    )

    return {
        "blocked": False,
        "category": category,
        "scores": scores,
        "reason": (
            "Recommendation selected from available "
            "wellness signals. This is not a diagnosis."
        ),
    }