from transformers import pipeline


MODEL_NAME = "j-hartmann/emotion-english-distilroberta-base"


emotion_classifier = pipeline(
    "text-classification",
    model=MODEL_NAME,
    top_k=None,
)


def analyze_emotion(text: str) -> dict:
    """
    Analyze the emotional content of a text.

    Returns the most likely emotion and confidence score.
    """

    if not text or not text.strip():
        raise ValueError("Text cannot be empty.")

    results = emotion_classifier(text.strip())

    predictions = results[0]

    best_prediction = max(
        predictions,
        key=lambda item: item["score"],
    )

    return {
        "emotion": best_prediction["label"],
        "confidence": round(
            best_prediction["score"],
            4,
        ),
    }
