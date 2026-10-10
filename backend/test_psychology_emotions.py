from app.nlp.emotion_analyzer import analyze_emotion


test_cases = [
    {
        "text": "I've been feeling really sad and low lately.",
        "expected": "sadness",
    },
    {
        "text": "I'm constantly worried about what might happen.",
        "expected": "fear",
    },
    {
        "text": "I feel extremely frustrated and angry right now.",
        "expected": "anger",
    },
    {
        "text": "I'm feeling happy and positive today.",
        "expected": "joy",
    },
    {
        "text": "I feel completely calm and okay today.",
        "expected": "neutral",
    },
    {
        "text": "I keep thinking about everything that could go wrong.",
        "expected": "fear",
    },
    {
        "text": "Nothing seems to interest me anymore.",
        "expected": "sadness",
    },
    {
        "text": "I'm really annoyed with everything around me.",
        "expected": "anger",
    },
    {
        "text": "I had a wonderful day and feel great.",
        "expected": "joy",
    },
    {
        "text": "I'm not sure how I feel about things right now.",
        "expected": "neutral",
    },
]


correct = 0


print("=" * 60)
print("PSYCHOLOGY DOMAIN EMOTION TEST")
print("=" * 60)


for index, case in enumerate(test_cases, start=1):

    result = analyze_emotion(case["text"])

    predicted = result["emotion"]
    confidence = result["confidence"]

    is_correct = predicted == case["expected"]

    if is_correct:
        correct += 1

    print(f"\nTest {index}")
    print("Text:", case["text"])
    print("Expected:", case["expected"])
    print("Predicted:", predicted)
    print("Confidence:", confidence)
    print("Result:", "PASS" if is_correct else "FAIL")


accuracy = correct / len(test_cases)


print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)

print(f"Correct: {correct}/{len(test_cases)}")
print(f"Accuracy: {accuracy:.2%}")