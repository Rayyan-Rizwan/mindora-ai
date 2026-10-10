from dataclasses import dataclass


@dataclass(frozen=True)
class AssessmentInstrument:
    code: str
    name: str
    description: str


WHO5 = AssessmentInstrument(
    code="who5",
    name="WHO-5 Well-Being Index",
    description="A brief self-report measure of current mental wellbeing.",
)


GAD7 = AssessmentInstrument(
    code="gad7",
    name="GAD-7",
    description="A brief screening measure of anxiety-related symptoms.",
)


INITIAL_WELLNESS = AssessmentInstrument(
    code="initial_wellness",
    name="Initial Mental Wellness Assessment",
    description=(
        "A short initial screening covering wellbeing, "
        "anxiety, mood, stress, and safety."
    ),
)


INSTRUMENTS = {
    WHO5.code: WHO5,
    GAD7.code: GAD7,
    INITIAL_WELLNESS.code: INITIAL_WELLNESS,
}


def get_instrument(code: str) -> AssessmentInstrument:
    instrument = INSTRUMENTS.get(code)

    if instrument is None:
        raise ValueError(
            f"Unsupported assessment instrument: {code}"
        )

    return instrument


def get_available_instruments() -> list[AssessmentInstrument]:
    return list(INSTRUMENTS.values())