from app.nlp.emotion_analyzer import analyze_emotion


test_messages = [
    "I've been feeling really sad and overwhelmed lately.",
    "I'm feeling really happy today.",
    "I am scared and worried about everything.",
    "I am so angry right now.",
    "I feel completely calm and relaxed.",
]


for message in test_messages:
    result = analyze_emotion(message)

    print("\nText:", message)
    print("Emotion:", result["emotion"])
    print("Confidence:", result["confidence"])