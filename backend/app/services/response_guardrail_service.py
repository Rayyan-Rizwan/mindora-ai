from typing import Any


# Phrases that should never appear as a diagnosis.
DIAGNOSIS_PATTERNS = (
    "you have depression",
    "you have anxiety disorder",
    "you have an anxiety disorder",
    "you have ptsd",
    "you have bipolar disorder",
    "you have ocd",
    "you are depressed",
    "you are clinically depressed",
)


# Phrases that could make a normal response unsafe.
UNSAFE_PATTERNS = (
    "you should kill yourself",
    "you should hurt yourself",
    "suicide is the answer",
    "there is no reason to live",
)


def validate_generated_response(
    response: str,
    risk_result: dict | None = None,
) -> dict[str, Any]:
    """
    Validate an AI-generated response before returning it.

    This is a lightweight output guardrail.
    It does not diagnose the user and does not replace
    the existing risk-detection or safety-response system.
    """

    if not response or not response.strip():
        return {
            "safe": False,
            "reason": "empty_response",
        }

    normalized_response = response.lower().strip()

    # ---------------------------------------------------------
    # 1. Block direct diagnosis language
    # ---------------------------------------------------------
    for pattern in DIAGNOSIS_PATTERNS:
        if pattern in normalized_response:
            return {
                "safe": False,
                "reason": "diagnosis_language",
            }

    # ---------------------------------------------------------
    # 2. Block clearly unsafe self-harm language
    # ---------------------------------------------------------
    for pattern in UNSAFE_PATTERNS:
        if pattern in normalized_response:
            return {
                "safe": False,
                "reason": "unsafe_language",
            }

    return {
        "safe": True,
        "reason": None,
    }