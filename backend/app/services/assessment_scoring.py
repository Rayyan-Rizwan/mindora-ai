def calculate_who5_score(answer_values: list[int]) -> dict:
    if len(answer_values) != 5:
        raise ValueError("WHO-5 requires exactly 5 answers.")

    if any(value < 0 or value > 5 for value in answer_values):
        raise ValueError("WHO-5 answers must be between 0 and 5.")

    raw_score = sum(answer_values)
    percentage_score = raw_score * 4

    if percentage_score >= 70:
        level = "good_wellbeing"
    else:
        level = "lower_wellbeing"

    return {
        "raw_score": raw_score,
        "percentage_score": percentage_score,
        "level": level,
    }


def calculate_gad7_score(answer_values: list[int]) -> dict:
    if len(answer_values) != 7:
        raise ValueError("GAD-7 requires exactly 7 answers.")

    if any(value < 0 or value > 3 for value in answer_values):
        raise ValueError("GAD-7 answers must be between 0 and 3.")

    total_score = sum(answer_values)

    if total_score <= 4:
        severity = "minimal"
    elif total_score <= 9:
        severity = "mild"
    elif total_score <= 14:
        severity = "moderate"
    else:
        severity = "severe"

    return {
        "total_score": total_score,
        "severity_level": severity,
    }


def calculate_short_section_score(answer_values: list[int]) -> dict:
    """
    Used for the custom mood and stress screening questions.

    These are screening indicators only and are NOT diagnostic scores.
    """

    if not answer_values:
        raise ValueError("At least one answer is required.")

    if any(value < 0 or value > 3 for value in answer_values):
        raise ValueError("Answers must be between 0 and 3.")

    total_score = sum(answer_values)
    maximum_score = len(answer_values) * 3

    percentage = round(
        (total_score / maximum_score) * 100
    )

    if percentage < 34:
        level = "low"
    elif percentage < 67:
        level = "moderate"
    else:
        level = "elevated"

    return {
        "total_score": total_score,
        "maximum_score": maximum_score,
        "percentage": percentage,
        "level": level,
    }


def calculate_safety_result(answer_value: int) -> dict:
    """
    Safety screening is kept separate from normal assessment scoring.

    A positive response indicates that additional safety support
    should be triggered. It is not treated as a diagnosis.
    """

    if answer_value not in (0, 1):
        raise ValueError("Safety answer must be 0 or 1.")

    return {
        "risk_flag": answer_value == 1,
    }