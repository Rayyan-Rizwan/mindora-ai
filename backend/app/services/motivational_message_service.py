
import random

MOTIVATIONAL_MESSAGES = [
    (
        "A Gentle Reminder",
        "You don't have to figure everything out today. Take one step at a time.",
    ),
    (
        "Keep Going",
        "Small steps still count. Give yourself credit for the progress you make.",
    ),
    (
        "Take a Breath",
        "Pause for a moment, take a slow breath, and give yourself some space.",
    ),
    (
        "Be Kind to Yourself",
        "You deserve the same patience and kindness you offer to others.",
    ),
    (
        "One Thing at a Time",
        "Focus on what you can do right now. The rest can wait.",
    ),
    (
        "A Moment for You",
        "It's okay to take a break. Rest is part of taking care of yourself.",
    ),
    (
        "You've Got This",
        "You don't need a perfect day. Just give yourself room to begin.",
    ),
]


def get_motivational_message() -> tuple[str, str]:
    """Return one randomly selected motivational title and message."""
    return random.choice(MOTIVATIONAL_MESSAGES)