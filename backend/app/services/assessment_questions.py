WHO5_OPTIONS = [
    {"label": "All of the time", "value": 5},
    {"label": "Most of the time", "value": 4},
    {"label": "More than half of the time", "value": 3},
    {"label": "Less than half of the time", "value": 2},
    {"label": "Some of the time", "value": 1},
    {"label": "At no time", "value": 0},
]


WHO5_QUESTIONS = [
    {
        "code": "WHO5_Q1",
        "question": "I have felt cheerful and in good spirits",
        "options": WHO5_OPTIONS,
    },
    {
        "code": "WHO5_Q2",
        "question": "I have felt calm and relaxed",
        "options": WHO5_OPTIONS,
    },
    {
        "code": "WHO5_Q3",
        "question": "I have felt active and vigorous",
        "options": WHO5_OPTIONS,
    },
    {
        "code": "WHO5_Q4",
        "question": "I woke up feeling fresh and rested",
        "options": WHO5_OPTIONS,
    },
    {
        "code": "WHO5_Q5",
        "question": "My daily life has been filled with things that interest me",
        "options": WHO5_OPTIONS,
    },
]


GAD7_OPTIONS = [
    {"label": "Not at all", "value": 0},
    {"label": "Several days", "value": 1},
    {"label": "More than half the days", "value": 2},
    {"label": "Nearly every day", "value": 3},
]


GAD7_QUESTIONS = [
    {
        "code": "GAD7_Q1",
        "question": "Feeling nervous, anxious, or on edge",
        "options": GAD7_OPTIONS,
    },
    {
        "code": "GAD7_Q2",
        "question": "Not being able to stop or control worrying",
        "options": GAD7_OPTIONS,
    },
    {
        "code": "GAD7_Q3",
        "question": "Worrying too much about different things",
        "options": GAD7_OPTIONS,
    },
    {
        "code": "GAD7_Q4",
        "question": "Trouble relaxing",
        "options": GAD7_OPTIONS,
    },
    {
        "code": "GAD7_Q5",
        "question": "Being so restless that it is hard to sit still",
        "options": GAD7_OPTIONS,
    },
    {
        "code": "GAD7_Q6",
        "question": "Becoming easily annoyed or irritable",
        "options": GAD7_OPTIONS,
    },
    {
        "code": "GAD7_Q7",
        "question": "Feeling afraid as if something awful might happen",
        "options": GAD7_OPTIONS,
    },
]


# ---------------------------------------------------------
# CUSTOM MOOD / STRESS SCREENING
# These are NOT PHQ-9 or PSS-10.
# ---------------------------------------------------------

MOOD_STRESS_OPTIONS = [
    {"label": "Not at all", "value": 0},
    {"label": "Several days", "value": 1},
    {"label": "More than half the days", "value": 2},
    {"label": "Nearly every day", "value": 3},
]


MOOD_STRESS_QUESTIONS = [
    {
        "code": "MOOD_Q1",
        "question": "How often have you felt down or low in mood recently?",
        "options": MOOD_STRESS_OPTIONS,
    },
    {
        "code": "STRESS_Q1",
        "question": "How often have you felt overwhelmed by the demands of your daily life?",
        "options": MOOD_STRESS_OPTIONS,
    },
]


# ---------------------------------------------------------
# SAFETY SCREENING
# Kept separate from the normal assessment score.
# ---------------------------------------------------------

SAFETY_OPTIONS = [
    {"label": "No", "value": 0},
    {"label": "Yes", "value": 1},
]


SAFETY_QUESTIONS = [
    {
        "code": "SAFETY_Q1",
        "question": "Are you currently having thoughts of hurting yourself or ending your life?",
        "options": SAFETY_OPTIONS,
    },
]


# ---------------------------------------------------------
# QUESTION CODES
# ---------------------------------------------------------

WHO5_QUESTION_CODES = [
    question["code"]
    for question in WHO5_QUESTIONS
]

GAD7_QUESTION_CODES = [
    question["code"]
    for question in GAD7_QUESTIONS
]

MOOD_STRESS_QUESTION_CODES = [
    question["code"]
    for question in MOOD_STRESS_QUESTIONS
]

SAFETY_QUESTION_CODES = [
    question["code"]
    for question in SAFETY_QUESTIONS
]


# ---------------------------------------------------------
# COMPLETE INITIAL ASSESSMENT
# ---------------------------------------------------------

INITIAL_ASSESSMENT_QUESTIONS = (
    WHO5_QUESTIONS
    + GAD7_QUESTIONS
    + MOOD_STRESS_QUESTIONS
    + SAFETY_QUESTIONS
)


def get_initial_assessment_questions():
    return INITIAL_ASSESSMENT_QUESTIONS


# Existing individual instrument support
def get_questions_for_instrument(instrument_code: str):

    if instrument_code == "who5":
        return WHO5_QUESTIONS

    if instrument_code == "gad7":
        return GAD7_QUESTIONS

    if instrument_code == "initial_wellness":
        return INITIAL_ASSESSMENT_QUESTIONS

    raise ValueError(
        f"Unsupported assessment instrument: {instrument_code}"
    )