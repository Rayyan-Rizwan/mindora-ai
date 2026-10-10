from datasets import load_dataset
from transformers import pipeline
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    classification_report,
    confusion_matrix,
)


MODEL_NAME = "j-hartmann/emotion-english-distilroberta-base"

LABELS = [
    "anger",
    "disgust",
    "fear",
    "joy",
    "sadness",
    "surprise",
    "neutral",
]


print("Loading dataset...")

dataset = load_dataset(
    "AiLab-IMCS-UL/go_emotions-en"
)

test_dataset = dataset["test"]


# Keep only examples with exactly one Ekman label.
single_label_dataset = test_dataset.filter(
    lambda item: len(item["labels_ekman"]) == 1
)


# Use a manageable evaluation sample.
SAMPLE_SIZE_PER_CLASS = 100

selected_texts = []
selected_labels = []

for label_id, label_name in enumerate(LABELS):
    class_examples = single_label_dataset.filter(
        lambda item: item["labels_ekman"][0] == label_id
    )

    class_examples = class_examples.select(
        range(
            min(
                SAMPLE_SIZE_PER_CLASS,
                len(class_examples),
            )
        )
    )

    selected_texts.extend(class_examples["text"])
    selected_labels.extend(
        [label_name] * len(class_examples)
    )


print(
    f"Evaluation samples: {len(selected_texts)}"
)


print("Loading emotion model...")

classifier = pipeline(
    "text-classification",
    model=MODEL_NAME,
)


print("Running predictions...")


predictions = classifier(
    selected_texts,
    batch_size=16,
    truncation=True,
)


predicted_labels = [
    prediction["label"]
    for prediction in predictions
]


accuracy = accuracy_score(
    selected_labels,
    predicted_labels,
)


precision, recall, f1, _ = (
    precision_recall_fscore_support(
        selected_labels,
        predicted_labels,
        labels=LABELS,
        average="macro",
        zero_division=0,
    )
)


print("\n" + "=" * 60)
print("EMOTION MODEL EVALUATION")
print("=" * 60)

print(f"Accuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1-score : {f1:.4f}")


print("\nClassification Report:")
print(
    classification_report(
        selected_labels,
        predicted_labels,
        labels=LABELS,
        zero_division=0,
    )
)


print("Confusion Matrix:")

matrix = confusion_matrix(
    selected_labels,
    predicted_labels,
    labels=LABELS,
)

print("Labels:")
print(LABELS)

print(matrix)