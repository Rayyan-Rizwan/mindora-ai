
from pydoc import text
import re
from difflib import SequenceMatcher


# ============================================================
# Psychology / Mental Wellness Keywords
# ============================================================

PSYCHOLOGY_KEYWORDS = {
    # --------------------------------------------------------
    # Anxiety / Worry
    # --------------------------------------------------------
    "anxiety",
    "anxious",
    "panic",
    "panic attack",
    "panic attacks",
    "nervous",
    "nervousness",
    "worry",
    "worried",
    "worrying",
    "fear",
    "afraid",
    "scared",
    "terrified",
    "uneasy",
    "restless",
    "restlessness",
    "apprehensive",
    "on edge",
    "overthinking",
    "overthink",
    "racing thoughts",

    # --------------------------------------------------------
    # Stress / Burnout
    # --------------------------------------------------------
    "stress",
    "stressed",
    "stressful",
    "stressing",
    "overwhelmed",
    "overwhelm",
    "burnout",
    "burned out",
    "burnt out",
    "pressure",
    "mental pressure",
    "work stress",
    "study stress",
    "exam stress",

    # --------------------------------------------------------
    # Depression / Sadness
    # --------------------------------------------------------
    "depression",
    "depressed",
    "sad",
    "sadness",
    "unhappy",
    "hopeless",
    "hopelessness",
    "empty",
    "emptiness",
    "worthless",
    "worthlessness",
    "helpless",
    "lonely",
    "loneliness",
    "low mood",
    "feeling down",
    "feel down",
    "down lately",

    # --------------------------------------------------------
    # Positive emotions
    # --------------------------------------------------------
    "happy",
    "happiness",
    "joy",
    "joyful",
    "excited",
    "excited about",
    "calm",
    "peaceful",
    "content",
    "relaxed",
    "relaxing",
    "positive",
    "good mood",
    "feeling good",
    "feeling happy",
    "feeling great",
    "feeling okay",
    "feeling fine",

    # --------------------------------------------------------
    # Emotional uncertainty
    # --------------------------------------------------------
    "confused",
    "confusion",
    "mixed feelings",
    "mixed emotions",
    "emotional confusion",
    "don't know how i feel",
    "do not know how i feel",
    "not sure how i feel",
    "unsure how i feel",
    "confused about how i feel",
    "confused about my feelings",
    "can't explain how i feel",
    "cannot explain how i feel",
    "i don't know what i'm feeling",
    "i do not know what i'm feeling",

    # --------------------------------------------------------
    # General emotions
    # --------------------------------------------------------
    "emotion",
    "emotions",
    "emotional",
    "feeling",
    "feelings",
    "mood",
    "moods",
    "irritable",
    "irritability",
    "frustrated",
    "frustration",
    "angry",
    "anger",
    "rage",
    "annoyed",
    "annoying",
    "guilt",
    "guilty",
    "shame",
    "ashamed",
    "jealous",
    "jealousy",
    "insecure",
    "insecurity",
    "confidence",
    "self esteem",
    "self-esteem",
    "low self esteem",

    # --------------------------------------------------------
    # Sleep
    # --------------------------------------------------------
    "sleep",
    "sleeping",
    "sleep problems",
    "sleep problem",
    "insomnia",
    "can't sleep",
    "cannot sleep",
    "dont sleep",
    "don't sleep",
    "trouble sleeping",
    "difficulty sleeping",
    "sleeping badly",
    "bad sleep",
    "nightmares",
    "nightmare",
    "sleep schedule",

    # --------------------------------------------------------
    # Motivation / Focus
    # --------------------------------------------------------
    "motivation",
    "motivated",
    "unmotivated",
    "motivationless",
    "no motivation",
    "lack of motivation",
    "concentration",
    "concentrate",
    "focus",
    "can't focus",
    "cannot focus",
    "difficulty concentrating",
    "distracted",
    "procrastination",
    "procrastinating",
    "procrastinate",

    # --------------------------------------------------------
    # Relationships / Social
    # --------------------------------------------------------
    "relationship",
    "relationships",
    "breakup",
    "break up",
    "heartbroken",
    "friendship",
    "friends",
    "family problems",
    "family issues",
    "relationship problems",
    "relationship issues",
    "social anxiety",
    "social isolation",
    "isolated",
    "isolation",
    "alone",
    "feeling alone",

    # --------------------------------------------------------
    # Trauma / Grief
    # --------------------------------------------------------
    "trauma",
    "traumatic",
    "ptsd",
    "grief",
    "grieving",
    "loss",
    "lost someone",
    "bereavement",

    # --------------------------------------------------------
    # Therapy / Professional help
    # --------------------------------------------------------
    "therapy",
    "therapist",
    "counselling",
    "counseling",
    "psychologist",
    "psychiatrist",
    "mental health professional",
    "professional help",
    "mental health",
    "mental-health",
    "psychology",
    "psychological",
    "mental wellbeing",
    "mental wellness",
    "wellbeing",
    "well-being",

    # --------------------------------------------------------
    # Coping / Self-help
    # --------------------------------------------------------
    "coping",
    "cope",
    "coping mechanism",
    "grounding",
    "grounding techniques",
    "mindfulness",
    "meditation",
    "relaxation",
    "breathing exercise",
    "breathing exercises",
    "calming",
    "calm down",
    "self care",
    "self-care",
    "journaling",
    "journal",
    "how can i cope",
    "how do i cope",
    "how to cope",
    "how can i feel better",

    # --------------------------------------------------------
    # Intrusive / Negative thoughts
    # --------------------------------------------------------
    "intrusive thoughts",
    "negative thoughts",
    "bad thoughts",
    "unwanted thoughts",
    "racing thoughts",
    "constant thoughts",
    "thinking too much",
    "thinking too much lately",
    "can't stop thinking",
    "cannot stop thinking",

    # --------------------------------------------------------
    # Common mental-health wording
    # --------------------------------------------------------
    "i feel terrible",
    "i feel awful",
    "i feel horrible",
    "i feel empty",
    "i feel lost",
    "i feel stuck",
    "i feel overwhelmed",
    "i feel stressed",
    "i feel anxious",
    "i feel depressed",
    "i feel sad",
    "i feel lonely",
    "i feel angry",
    "i feel scared",
    "i feel nervous",
    "something feels wrong",
    "something is wrong with me",
    "not feeling myself",
    "not myself lately",
    "i am not okay",
    "i'm not okay",
    "im not okay",
    "i am not feeling okay",
    "i'm not feeling okay",
    "im not feeling okay",

    # --------------------------------------------------------
    # Common Roman Urdu / mixed-language phrases
    # --------------------------------------------------------
    "tension",
    "tension ho rahi",
    "tension hai",
    "stress ho raha",
    "stress ho rahi",
    "pareshan",
    "pareshani",
    "ghabrahat",
    "ghabra raha",
    "ghabra rahi",
    "udaas",
    "udas",
    "dukhi",
    "akela",
    "akelapan",
    "thak gaya",
    "thak gayi",
    "dimagh kharab",
    "dimagh mein bohat kuch",
    "overthink kar raha",
    "overthink kar rahi",
    "neend nahi aa rahi",
    "so nahi pa raha",
    "so nahi pa rahi",
    "dil udaas",
    "dil heavy",
    "mood kharab",
    "mood off",
    "mood acha nahi",
}


# ============================================================
# General Conversation
# ============================================================

GENERAL_CONVERSATION_PHRASES = {
    # Greetings
    "hi",
    "hello",
    "hey",
    "hii",
    "hiii",
    "heyy",
    "yo",
    "thank you so much",
    "yes",
    # Time greetings
    "good morning",
    "good afternoon",
    "good evening",
    "good night",

    # General questions
    "how are you",
    "how are you doing",
    "how have you been",
    "how is your day",

    # Positive responses
    "i'm good",
    "im good",
    "i am good",
    "i'm fine",
    "im fine",
    "i am fine",
    "i'm okay",
    "im okay",
    "i am okay",
    "i'm doing good",
    "im doing good",
    "i am doing good",
    "i'm going good",
    "im going good",
    "i am going good",
    "i'm doing well",
    "im doing well",
    "i am doing well",

    # Gratitude
    "thanks",
    "thank you",
    "thankyou",
    "thx",
    "ty",
    "tysm",
    "thank u",

    # Confirmation / agreement
    "okay",
    "ok",
    "alright",
    "sure",
    "yeah",
    "yep",
    "yup",
    "yes",
    "nope",
    "right",
    "maybe",

    # Short reactions
    "hmm",
    "hmmm",
    "hm",
    "uhm",
    "umm",
    "um",
    "idk",
    "i dont know",
    "i don't know",
    "dunno",
    "i see",
    "got it",
    "oh",
    "oh okay",
    "wbu",
    "what about you",
    "not good",
    "not great",
    "not okay", 
}


# ============================================================
# Text Normalization
# ============================================================

def normalize_text(message: str) -> str:
    """
    Normalize user input while preserving apostrophes.

    Examples:

        "I'm anxious!!!"
            -> "i'm anxious"

        "I DON'T know how I feel"
            -> "i don't know how i feel"

        "I'm   really stressed"
            -> "i'm really stressed"
    """

    if not message:
        return ""

    text = message.lower().strip()

    # Normalize curly apostrophes.
    text = text.replace("’", "'")
    text = text.replace("‘", "'")

    # Remove punctuation except apostrophe and hyphen.
    text = re.sub(
        r"[^\w\s'-]",
        " ",
        text,
    )

    # Normalize whitespace.
    text = re.sub(
        r"\s+",
        " ",
        text,
    ).strip()

    return text


# ============================================================
# Chat Slang / Casual Spelling Normalization
# ============================================================

def normalize_chat_slang(text: str) -> str:
    """
    Normalize common chat abbreviations and casual spellings.

    Examples:
        ty       -> thank you
        thx      -> thanks
        tysm     -> thank you so much
        thank u  -> thank you
        okie     -> okay
        okkkk    -> okay
        yep      -> yes
        yuppp    -> yes
        idk      -> i don't know
        dunno    -> i don't know
    """

    if not text:
        return ""

    # --------------------------------------------------------
    # Phrase-level replacements
    # --------------------------------------------------------
    phrase_replacements = {
        "thank u": "thank you",
        "thankyou": "thank you",
        "tysm": "thank you so much",
        "okie": "okay",
        "okey": "okay",
        "idk": "i don't know",
        "dunno": "i don't know",
    }

    for old, new in phrase_replacements.items():
        text = re.sub(
            rf"\b{re.escape(old)}\b",
            new,
            text,
        )

    # --------------------------------------------------------
    # Single-word replacements
    # --------------------------------------------------------
    word_replacements = {
        "ty": "thank you",
        "thx": "thanks",
        "yep": "yes",
        "yup": "yes",
        "hmmm": "hmm",
        "hm": "hmm",
        "ummm": "umm",
    }

    words = text.split()

    normalized_words = []

    for word in words:
        normalized_words.append(
            word_replacements.get(word, word)
        )

    text = " ".join(normalized_words)

    # --------------------------------------------------------
    # Handle excessive repeated letters
    # --------------------------------------------------------
    text = re.sub(
        r"(.)\1{2,}",
        r"\1",
        text,
    )

    # --------------------------------------------------------
    # Handle common stretched casual words
    # --------------------------------------------------------
    text = re.sub(r"\bok+\b", "okay", text)
    text = re.sub(r"\by+e+s+\b", "yes", text)
    text = re.sub(r"\by+u+p+\b", "yes", text)

    # Normalize whitespace.
    text = re.sub(r"\s+", " ", text).strip()

    return text

# ============================================================
# Common Typing / Contraction Normalization
# ============================================================

def normalize_common_variations(text: str) -> str:
    """
    Normalize common typing variations without trying
    to silently rewrite the user's entire message.
    """

    replacements = {
        # ----------------------------------------------------
        # Contractions
        # ----------------------------------------------------
        "im ": "i'm ",
        "ive ": "i've ",
        "id ": "i'd ",
        "ill ": "i'll ",
        "dont ": "don't ",
        "cant ": "can't ",
        "cannot ": "can't ",
        "wont ": "won't ",
        "isnt ": "isn't ",
        "arent ": "aren't ",
        "wasnt ": "wasn't ",
        "werent ": "weren't ",
        "doesnt ": "doesn't ",
        "didnt ": "didn't ",
        "havent ": "haven't ",
        "hasnt ": "hasn't ",
        "wouldnt ": "wouldn't ",
        "couldnt ": "couldn't ",
        "shouldnt ": "shouldn't ",
        "thats ": "that's ",
        "whats ": "what's ",
        "howre ": "how're ",
        "youre ": "you're ",
        "theyre ": "they're ",

        # ----------------------------------------------------
        # Common chat spellings
        # ----------------------------------------------------
        "u ": "you ",
        "ur ": "your ",
        "pls ": "please ",
        "plz ": "please ",
        "bc ": "because ",
        "bcz ": "because ",
        "coz ": "because ",
        "cuz ": "because ",
        "idk ": "i don't know ",
        "imo ": "in my opinion ",

        # ----------------------------------------------------
        # Common mental-health typing variants
        # ----------------------------------------------------
        "anxiouss": "anxious",
        "anxios": "anxious",
        "anxius": "anxious",
        "anxeity": "anxiety",
        "anxity": "anxiety",

        "stresed": "stressed",
        "stressd": "stressed",
        "stres": "stress",

        "depresed": "depressed",
        "depresd": "depressed",
        "depresion": "depression",
        "deprssion": "depression",

        "sadnes": "sadness",

        "angery": "angry",
        "angrey": "angry",

        "lonley": "lonely",
        "lonliness": "loneliness",

        "overwelmed": "overwhelmed",
        "overwhelmmed": "overwhelmed",

        "motivatoin": "motivation",
        "motivationless": "unmotivated",

        "insomia": "insomnia",

        "theraphy": "therapy",
        "therapistt": "therapist",

        "mindfullness": "mindfulness",
        "meditaton": "meditation",

        "emtion": "emotion",
        "emtoion": "emotion",
        "emotionss": "emotions",

        "feelingg": "feeling",
        "feelng": "feeling",

        "confusd": "confused",
        "confussion": "confusion",

        "calmly": "calm",
        "peacful": "peaceful",
    }

    words = text.split()
    normalized_words = []

    for word in words:
        normalized_words.append(
            replacements.get(word, word)
        )

    return " ".join(normalized_words)


# ============================================================
# Exact Phrase Matching
# ============================================================

def contains_exact_psychology_phrase(text: str) -> bool:
    """
    Detect known multi-word psychology phrases.
    """

    for phrase in PSYCHOLOGY_KEYWORDS:
        if " " not in phrase:
            continue

        if phrase in text:
            return True

    return False


# ============================================================
# Exact Keyword Matching
# ============================================================

def contains_exact_psychology_keyword(text: str) -> bool:
    """
    Detect exact psychology keywords.

    Word boundaries prevent accidental partial matches.
    """

    words = set(text.split())

    for keyword in PSYCHOLOGY_KEYWORDS:
        if " " in keyword:
            continue

        if keyword in words:
            return True

    return False


# ============================================================
# Typo-Tolerant Matching
# ============================================================

TYPO_SAFE_KEYWORDS = {
    "anxiety",
    "anxious",
    "panic",
    "nervous",
    "worry",
    "worried",
    "stress",
    "stressed",
    "overwhelmed",
    "burnout",
    "depression",
    "depressed",
    "sad",
    "sadness",
    "hopeless",
    "empty",
    "lonely",
    "happy",
    "happiness",
    "joy",
    "calm",
    "peaceful",
    "confused",
    "emotion",
    "emotions",
    "emotional",
    "feeling",
    "feelings",
    "mood",
    "angry",
    "anger",
    "frustrated",
    "frustration",
    "guilty",
    "guilt",
    "sleep",
    "insomnia",
    "nightmare",
    "motivation",
    "unmotivated",
    "concentration",
    "focus",
    "trauma",
    "grief",
    "therapy",
    "therapist",
    "psychologist",
    "psychiatrist",
    "coping",
    "grounding",
    "mindfulness",
    "meditation",
    "overthinking",
}


def similarity_score(a: str, b: str) -> float:
    """
    Return similarity between two words.
    """

    return SequenceMatcher(
        None,
        a,
        b,
    ).ratio()


def contains_typo_tolerant_keyword(text: str) -> bool:
    """
    Detect common spelling mistakes.

    Conservative thresholds are used so unrelated words
    are not accidentally classified as psychology queries.
    """

    words = text.split()

    for word in words:
        # Very short words are too ambiguous for fuzzy matching.
        if len(word) < 5:
            continue

        for keyword in TYPO_SAFE_KEYWORDS:

            # Only compare reasonably similar lengths.
            if abs(len(word) - len(keyword)) > 3:
                continue

            score = similarity_score(
                word,
                keyword,
            )

            # Longer words can use a slightly lower threshold.
            if len(keyword) >= 8:
                threshold = 0.78
            else:
                threshold = 0.84

            if score >= threshold:
                return True

    return False


# ============================================================
# Psychology Query Detection
# ============================================================

def is_psychology_query(message: str) -> bool:
    """
    Determine whether a message belongs to the psychology /
    mental-wellness domain.

    Detection layers:

    1. Normalize text.
    2. Normalize chat slang.
    3. Normalize common typing variations.
    4. Match known phrases.
    5. Match exact keywords.
    6. Match conservative spelling mistakes.
    """

    if not message or not message.strip():
        return False

    text = normalize_text(message)

    if not text:
        return False

    # Chat slang normalization.
    text = normalize_chat_slang(text)

    # Existing typing/contraction normalization.
    text = normalize_common_variations(text)

    # --------------------------------------------------------
    # Exact phrase matching
    # --------------------------------------------------------

    if contains_exact_psychology_phrase(text):
        return True

    # --------------------------------------------------------
    # Exact keyword matching
    # --------------------------------------------------------

    if contains_exact_psychology_keyword(text):
        return True

    # --------------------------------------------------------
    # Typo-tolerant matching
    # --------------------------------------------------------

    if contains_typo_tolerant_keyword(text):
        return True

    return False


# ============================================================
# General Conversation Detection
# ============================================================

def is_general_conversation(message: str) -> bool:
    """
    Detect simple everyday conversation such as greetings,
    thanks, confirmations, basic responses, and casual messages.
    """

    if not message or not message.strip():
        return False

    text = normalize_text(message)

    if not text:
        return False

    # Normalize chat slang first.
    text = normalize_chat_slang(text)

    # Then apply existing typing/contraction normalization.
    text = normalize_common_variations(text)

    # ---------------------------------------------------------
    # 1. Existing exact general conversation phrases
    # ---------------------------------------------------------
    if text in GENERAL_CONVERSATION_PHRASES:
        return True

    # ---------------------------------------------------------
    # 2. Greetings
    # ---------------------------------------------------------
    greeting_patterns = (
        "hi",
        "hello",
        "hey",
        "heyy",
        "heyyy",
        "good morning",
        "good afternoon",
        "good evening",
        "good night",
        "howdy",
    )

    if text in greeting_patterns:
        return True

    # Natural greeting variations
    if text.startswith(("hi ", "hello ", "hey ")):
        return True

    # ---------------------------------------------------------
    # 3. Basic "how are you?" conversation
    # ---------------------------------------------------------
    how_are_you_patterns = (
        "how are you",
        "how are u",
        "how r you",
        "how r u",
        "how have you been",
        "how is it going",
        "how's it going",
        "hows it going",
        "what's up",
        "whats up",
        "sup",
        "hru",
        "how r u",
        "how r you",
    )

    if text in how_are_you_patterns:
        return True

    # ---------------------------------------------------------
    # 4. Short casual responses
    # ---------------------------------------------------------
    casual_responses = (
        "im good",
        "i am good",
        "im fine",
        "i am fine",
        "im okay",
        "i am okay",
        "im ok",
        "i am ok",
        "doing good",
        "doing fine",
        "doing great",
        "pretty good",
        "all good",
        "not bad",
        "same here",
        "me too",
        "yeah",
        "yes",
        "yep",
        "yup",
        "nope",
        "nah",
        "okay",
        "ok",
        "alright",
        "sure",
        "thanks",
        "thank you",
        "thank u",
        "got it",
        "understood",
    )

    if text in casual_responses:
        return True

    # ---------------------------------------------------------
    # 5. WBU / "what about you?"
    # ---------------------------------------------------------
    if text in {
        "wbu",
        "what about you",
        "what about u",
        "and you",
        "and u",
    }:
        return True

        # ---------------------------------------------------------
    # 6. Everyday emotional / casual conversation
    # ---------------------------------------------------------
    everyday_prefixes = (
        "i'm having a bad day",
        "i'm having a rough day",
        "i am having a bad day",
        "i am having a rough day",
        "i'm really tired",
"i am really tired",
"i'm very tired",
"i am very tired",
"i'm so tired",
"i am so tired",
"i'm really bored",
"i am really bored",
"i'm very bored",
"i am very bored",
"i'm so bored",
"i am so bored",
        "i'm bored",
        "i am bored",

        "i'm tired",
        "i am tired",

        "i'm exhausted",
        "i am exhausted",

        "i'm having a good day",
        "i am having a good day",

        "i'm having a great day",
        "i am having a great day",
    )

    if text.startswith(everyday_prefixes):
        return True

    everyday_patterns = (
        "bad day",
        "rough day",
        "today was rough",
        "long day",
        "good day",
        "great day",
        "tired",
        "exhausted",
        "bored",
    )

    if text in everyday_patterns:
        return True