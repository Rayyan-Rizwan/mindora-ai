import httpx

from app.core.config import settings
from app.nlp.emotion_analyzer import analyze_emotion
from app.rag.retriever import retrieve_relevant_documents


MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"


def build_assessment_context(
    assessment_context: dict | None,
) -> str:
    """
    Convert structured assessment information into
    private internal context for the AI.

    Assessment information is screening context only.
    It is not a medical diagnosis.
    """

    if not assessment_context:
        return (
            "No completed mental wellness assessment is available "
            "for this user yet."
        )

    wellbeing = assessment_context.get("wellbeing")
    anxiety = assessment_context.get("anxiety")
    mood = assessment_context.get("mood")
    stress = assessment_context.get("stress")
    overall = assessment_context.get("overall")
    safety_flag = assessment_context.get(
        "safety_flag",
        False,
    )

    return (
        "Private internal wellness context. "
        "Use this information silently to personalize "
        "your responses. Do not tell the user that you "
        "received or reviewed an assessment unless the "
        "user specifically asks about their assessment.\n\n"
        "This is screening context only and must never be "
        "treated as a diagnosis or medical conclusion.\n\n"
        f"Wellbeing indication: {wellbeing}\n"
        f"Anxiety screening indication: {anxiety}\n"
        f"Mood indication: {mood}\n"
        f"Stress indication: {stress}\n"
        f"Overall screening indication: {overall}\n"
        f"Safety flag: {safety_flag}"
    )


def build_conversation_history(
    conversation_history: list[dict] | None,
) -> list[dict]:
    """
    Convert stored conversation messages into the format
    expected by the Mistral chat completion API.

    Only user and AI messages are included.
    """

    if not conversation_history:
        return []

    messages = []

    for item in conversation_history:
        role = item.get("role")
        content = item.get("content")

        if role not in {"user", "assistant"}:
            continue

        if not content:
            continue

        messages.append(
            {
                "role": role,
                "content": content,
            }
        )

    return messages

def get_emotion_result(
    message: str,
) -> dict | None:
    """
    Get the current message's emotion result.

    Emotion analysis is an NLP classification signal only.
    It is not a diagnosis or clinical assessment.

    If emotion analysis fails, return None so the
    chatbot can continue normally.
    """

    try:
        return analyze_emotion(message)
    except Exception:
        return None

    
def build_emotion_context(
    message: str,
    emotion_result: dict | None = None,
) -> str:
    """
    Analyze the current user message for emotional signals.

    Emotion analysis is only an NLP classification signal.
    It is not a diagnosis or clinical assessment.

    If emotion analysis fails, the chatbot continues normally.
    """

    try:
        if emotion_result is None:
            emotion_result = get_emotion_result(message)

        if not emotion_result:
            return (
                "Emotion analysis was unavailable for this message. "
                "Do not infer an emotional state from this signal."
            )

        emotion = emotion_result.get("emotion")
        confidence = emotion_result.get("confidence")

        if not emotion:
            return (
                "No reliable emotional signal was detected "
                "from the current message."
            )

        return (
            "Current message emotional signal:\n"
            f"Emotion: {emotion}\n"
            f"Confidence: {confidence}\n\n"
            "This is an NLP classification signal only. "
            "It is not a diagnosis, clinical assessment, "
            "or definitive statement about the user's "
            "mental state."
        )

    except Exception:
        # Emotion analysis must never break the chatbot.
        return (
            "Emotion analysis was unavailable for this message. "
            "Do not infer an emotional state from this signal."
        )

def build_support_recommendation_context(
    support_recommendation: dict | None,
) -> str:
    """
    Convert the Phase 11 personalized-support recommendation
    into private internal context for the AI.

    This is a wellness recommendation signal only.
    It is not a diagnosis or clinical conclusion.
    """

    if not support_recommendation:
        return (
            "No personalized support recommendation is "
            "available for this message."
        )

    if support_recommendation.get("blocked") is True:
        return (
            "Personalized support recommendations are blocked "
            "because the existing safety system has priority. "
            "Do not generate a normal personalized-support "
            "recommendation from this context."
        )

    category = support_recommendation.get("category")

    if not category:
        return (
            "No personalized support recommendation is "
            "available for this message."
        )

    recommendation_names = {
        "breathing_exercise": "breathing or calming exercise",
        "grounding_exercise": "grounding exercise",
        "journaling": "journaling or reflective writing",
        "professional_support": "professional support",
    }

    recommendation = recommendation_names.get(
        category,
        "general wellness support",
    )

    return (
        "Private personalized-support context.\n"
        f"Suggested support direction: {recommendation}\n\n"
        "This is a wellness recommendation signal only. "
        "It is not a diagnosis, clinical assessment, or "
        "medical conclusion.\n\n"
        "Use this suggestion only when it naturally fits "
        "the user's current message. Do not mention the "
        "internal recommendation system to the user."
    )

def is_physical_symptom_query(
    message: str,
) -> bool:
    """
    Detect potentially important physical-symptom queries.

    This is a deterministic safety guard. These messages are
    handled before sending the request to the LLM so that the
    LLM cannot incorrectly assume that the physical symptom
    is caused by anxiety or stress.
    """

    if not message or not message.strip():
        return False

    text = message.lower().strip()

    physical_terms = {

        # -----------------------------------------------------
        # Heart / circulation
        # -----------------------------------------------------
        "racing heart",
        "heart racing",
        "heart rate",
        "heart is racing",
        "heart has been racing",
        "my heart is racing",
        "my heart has been racing",
        "heart beating fast",
        "heart beating quickly",
        "heartbeat is fast",
        "heartbeat is racing",
        "fast heartbeat",
        "rapid heartbeat",
        "irregular heartbeat",
        "palpitations",

        # -----------------------------------------------------
        # Chest
        # -----------------------------------------------------
        "chest pain",
        "chest pressure",
        "chest tightness",
        "chest discomfort",
        "pain in my chest",
        "pressure in my chest",
        "tightness in my chest",

        # -----------------------------------------------------
        # Breathing
        # -----------------------------------------------------
        "difficulty breathing",
        "trouble breathing",
        "hard to breathe",
        "hard to breath",
        "shortness of breath",
        "can't breathe",
        "cannot breathe",
        "cant breathe",
        "breathing difficulty",
        "difficulty catching my breath",
        "struggling to breathe",
        "breathing problem",

        # -----------------------------------------------------
        # Dizziness / fainting
        # -----------------------------------------------------
        "dizziness",
        "dizzy",
        "very dizzy",
        "severe dizziness",
        "lightheaded",
        "light headed",
        "feeling faint",
        "fainting",
        "fainted",
        "passing out",
        "passed out",
        "blacked out",
        "blackout",

        # -----------------------------------------------------
        # Head / neurological
        # -----------------------------------------------------
        "headache",
        "severe headache",
        "head pain",
        "migraine",
        "severe head pain",
        "confusion",
        "confused",
        "sudden confusion",
        "loss of consciousness",
        "numbness",
        "numb",
        "tingling",
        "weakness",
        "sudden weakness",
        "vision changes",
        "blurred vision",
        "double vision",
        "difficulty speaking",
        "slurred speech",
        "trouble speaking",
        "seizure",
        "seizures",

        # -----------------------------------------------------
        # Stomach / abdominal
        # -----------------------------------------------------
        "stomach pain",
        "stomach ache",
        "stomachache",
        "abdominal pain",
        "severe stomach pain",
        "severe abdominal pain",
        "pain in my stomach",
        "pain in my abdomen",
        "belly pain",
        "severe belly pain",
        "nausea",
        "feeling nauseous",
        "vomiting",
        "throwing up",
        "blood in vomit",
        "diarrhea",
        "severe diarrhea",

        # -----------------------------------------------------
        # Fever / infection-type symptoms
        # -----------------------------------------------------
        "high fever",
        "fever",
        "very high fever",
        "chills",
        "severe chills",
        "sweating",
        "cold sweat",
        "night sweats",

        # -----------------------------------------------------
        # Pain
        # -----------------------------------------------------
        "severe pain",
        "extreme pain",
        "sharp pain",
        "sudden pain",
        "persistent pain",
        "pain that won't go away",
        "pain that wont go away",
        "nauseous",
        "vomiting blood",

        # -----------------------------------------------------
        # Back / neck
        # -----------------------------------------------------
        "severe back pain",
        "back pain",
        "severe neck pain",
        "neck pain",
        "pain in my back",
        "pain in my neck",

        # -----------------------------------------------------
        # Allergic / swelling symptoms
        # -----------------------------------------------------
        "swelling",
        "face swelling",
        "throat swelling",
        "swollen throat",
        "swollen tongue",
        "difficulty swallowing",
        "trouble swallowing",
        "hives",

        # -----------------------------------------------------
        # Bleeding
        # -----------------------------------------------------
        "blood in stool",
        "blood in my stool",
        "bloody stool",
        "blood in urine",
        "blood in my urine",
        "coughing blood",
        "vomiting blood",
        "unexplained bleeding",

        # -----------------------------------------------------
        # Other potentially concerning symptoms
        # -----------------------------------------------------
        "severe weakness",
        "extreme weakness",
        "unable to move",
        "difficulty moving",
        "loss of balance",
        "severe fatigue",
        "extreme fatigue",
        "dehydration",
        "difficulty urinating",
        "unable to urinate",
    }

    return any(
        term in text
        for term in physical_terms
    )


def build_physical_symptom_response(message: str) -> str:
    text = message.lower().strip()

    # ---------------------------------------------------------
    # 1. CHEST PAIN / PRESSURE / TIGHTNESS
    # ---------------------------------------------------------
    if (
        "chest pain" in text
        or "chest pressure" in text
        or "chest tightness" in text
        or "chest discomfort" in text
        or "pain in my chest" in text
        or "pressure in my chest" in text
        or "tightness in my chest" in text
    ):
        return (
            "Chest pain can have different causes, so it is important "
            "not to assume that anxiety or stress is the cause. If "
            "the pain is severe, new, persistent, worsening, or happens "
            "with difficulty breathing, fainting, severe dizziness, "
            "sweating, or other concerning symptoms, please seek "
            "urgent medical attention.\n\n"
            "If you are safe right now, we can also talk about what "
            "you are experiencing and explore some gentle calming "
            "techniques."
        )

    # ---------------------------------------------------------
    # 2. TROUBLE BREATHING
    # ---------------------------------------------------------
    if (
        "difficulty breathing" in text
        or "trouble breathing" in text
        or "hard to breathe" in text
        or "hard to breath" in text
        or "shortness of breath" in text
        or "can't breathe" in text
        or "cannot breathe" in text
        or "cant breathe" in text
        or "breathing difficulty" in text
        or "difficulty catching my breath" in text
        or "struggling to breathe" in text
        or "breathing problem" in text
    ):
        return (
            "Difficulty breathing can have different causes and should "
            "not automatically be assumed to be anxiety or stress. If "
            "you are struggling to breathe, cannot catch your breath, "
            "or the breathing difficulty is severe, sudden, worsening, "
            "or happens with chest pain, fainting, confusion, or blue "
            "lips, please seek urgent medical attention.\n\n"
            "If you are safe right now, we can stay here and talk "
            "through what you are experiencing."
        )

    # ---------------------------------------------------------
    # 3. RACING HEART / PALPITATIONS
    # ---------------------------------------------------------
    if (
        "racing heart" in text
        or "heart racing" in text
        or "palpitations" in text
        or "heart beating fast" in text
        or "heart beating quickly" in text
        or "heartbeat is fast" in text
        or "heartbeat is racing" in text
        or "my heart is racing" in text
        or "my heart has been racing" in text
        or "fast heartbeat" in text
        or "rapid heartbeat" in text
        or "irregular heartbeat" in text
    ):
        return (
            "A racing or irregular heartbeat can sometimes happen "
            "alongside anxiety or stress, but there can also be other "
            "causes, so it is important not to assume the cause. If "
            "this symptom is new, persistent, severe, or worsening, "
            "or happens with chest pain, difficulty breathing, fainting, "
            "or severe dizziness, please seek medical attention promptly.\n\n"
            "If you are otherwise safe right now, we can also explore "
            "some gentle grounding or calming techniques."
        )

    # ---------------------------------------------------------
    # 4. DIZZINESS / FAINTING
    # ---------------------------------------------------------
    if (
        "dizziness" in text
        or "dizzy" in text
        or "very dizzy" in text
        or "severe dizziness" in text
        or "lightheaded" in text
        or "light headed" in text
        or "feeling faint" in text
        or "fainting" in text
        or "fainted" in text
        or "passing out" in text
        or "passed out" in text
        or "blacked out" in text
        or "blackout" in text
        or "loss of consciousness" in text
    ):
        return (
            "Dizziness or fainting can have different causes, so it is "
            "important not to assume that anxiety or stress is the cause. "
            "If you have fainted, lost consciousness, have severe or "
            "persistent dizziness, or experience chest pain, difficulty "
            "breathing, confusion, severe weakness, or another concerning "
            "symptom, please seek medical attention promptly.\n\n"
            "If you are safe right now, we can also talk about what "
            "you are experiencing."
        )

    # ---------------------------------------------------------
    # 5. HEADACHE / MIGRAINE
    # ---------------------------------------------------------
    if (
        "headache" in text
        or "severe headache" in text
        or "head pain" in text
        or "migraine" in text
        or "severe head pain" in text
    ):
        return (
            "Headaches and migraines can have many possible causes, so "
            "it is important not to assume that anxiety or stress is "
            "the cause. If the headache is sudden and severe, new, "
            "persistent, worsening, or happens with fainting, confusion, "
            "weakness, vision changes, difficulty speaking, or another "
            "concerning symptom, please seek medical attention promptly.\n\n"
            "If you are otherwise safe right now, we can also explore "
            "some gentle calming or relaxation techniques."
        )

    # ---------------------------------------------------------
    # 6. VISION / SPEECH / NUMBNESS / WEAKNESS
    # ---------------------------------------------------------
    if (
        "vision changes" in text
        or "blurred vision" in text
        or "double vision" in text
        or "difficulty speaking" in text
        or "slurred speech" in text
        or "trouble speaking" in text
        or "numbness" in text
        or "numb" in text
        or "tingling" in text
        or "weakness" in text
        or "sudden weakness" in text
        or "confusion" in text
        or "confused" in text
    ):
        return (
            "Changes such as blurred or double vision, unusual numbness, "
            "weakness, confusion, or difficulty speaking can have different "
            "causes and should not automatically be attributed to anxiety "
            "or stress. If these symptoms are sudden, severe, or worsening, "
            "please seek prompt medical attention.\n\n"
            "If you are safe right now, we can also talk about what "
            "you are experiencing."
        )

    # ---------------------------------------------------------
    # 7. SEIZURE
    # ---------------------------------------------------------
    if "seizure" in text or "seizures" in text:
        return (
            "A seizure can require urgent medical attention, especially "
            "if it is a first-time event, lasts longer than expected, "
            "happens repeatedly, or causes injury or loss of consciousness. "
            "Please seek urgent medical care if this is happening now or "
            "has just happened.\n\n"
            "If you are safe right now, we can also talk about what "
            "you experienced."
        )

    # ---------------------------------------------------------
    # 8. STOMACH / ABDOMINAL PAIN
    # ---------------------------------------------------------
    if (
        "stomach pain" in text
        or "stomach ache" in text
        or "stomachache" in text
        or "abdominal pain" in text
        or "severe stomach pain" in text
        or "severe abdominal pain" in text
        or "pain in my stomach" in text
        or "pain in my abdomen" in text
        or "belly pain" in text
        or "severe belly pain" in text
    ):
        return (
            "Stomach or abdominal pain can have different causes, so it "
            "is important not to assume that anxiety or stress is the "
            "cause. If the pain is severe, new, persistent, worsening, "
            "or happens with repeated vomiting, fainting, blood in vomit "
            "or stool, fever, or another concerning symptom, please seek "
            "medical attention promptly.\n\n"
            "If you are otherwise safe right now, we can also talk about "
            "what you are experiencing."
        )

    # ---------------------------------------------------------
    # 9. NAUSEA / VOMITING / DIARRHEA
    # ---------------------------------------------------------
    if (
        "nausea" in text
        or "nauseous" in text
        or "vomiting" in text
        or "throwing up" in text
        or "blood in vomit" in text
        or "vomiting blood" in text
        or "diarrhea" in text
        or "severe diarrhea" in text
    ):
        return (
            "Nausea, vomiting, or diarrhea can have different causes, "
            "so it is important not to assume that anxiety or stress is "
            "the cause. If symptoms are severe or persistent, or you "
            "notice blood, severe weakness, fainting, or signs of "
            "dehydration, please seek medical attention promptly.\n\n"
            "If you are safe right now, we can also talk about what "
            "you are experiencing."
        )

    # ---------------------------------------------------------
    # 10. FEVER / CHILLS
    # ---------------------------------------------------------
    if (
        "fever" in text
        or "high fever" in text
        or "very high fever" in text
        or "chills" in text
        or "severe chills" in text
        or "cold sweat" in text
        or "night sweats" in text
    ):
        return (
            "Fever, chills, and sweating can have different causes and "
            "should not automatically be attributed to anxiety or stress. "
            "If the fever is high, persistent, worsening, or occurs with "
            "confusion, severe weakness, difficulty breathing, or another "
            "concerning symptom, please seek medical attention.\n\n"
            "If you are safe right now, we can also talk about what "
            "you are experiencing."
        )

    # ---------------------------------------------------------
    # 11. BACK / NECK PAIN
    # ---------------------------------------------------------
    if (
        "back pain" in text
        or "severe back pain" in text
        or "neck pain" in text
        or "severe neck pain" in text
        or "pain in my back" in text
        or "pain in my neck" in text
    ):
        return (
            "Back or neck pain can have different causes, so it is "
            "important not to assume that anxiety or stress is the cause. "
            "If the pain is severe, sudden, persistent, worsening, or "
            "happens with numbness, weakness, difficulty moving, or another "
            "concerning symptom, please seek medical attention.\n\n"
            "If you are otherwise safe right now, we can also talk about "
            "what you are experiencing."
        )

    # ---------------------------------------------------------
    # 12. SWELLING / ALLERGIC-TYPE SYMPTOMS
    # ---------------------------------------------------------
    if (
        "throat swelling" in text
        or "swollen throat" in text
        or "swollen tongue" in text
        or "face swelling" in text
        or "difficulty swallowing" in text
        or "trouble swallowing" in text
        or "hives" in text
    ):
        return (
            "Swelling of the face, throat, or tongue, or difficulty "
            "swallowing can sometimes require urgent medical attention. "
            "If you are having trouble breathing, significant swelling, "
            "or rapidly worsening symptoms, please seek emergency medical "
            "help immediately.\n\n"
            "If you are safe right now, we can also talk about what "
            "you are experiencing."
        )

    # ---------------------------------------------------------
    # 13. BLEEDING
    # ---------------------------------------------------------
    if (
        "blood in stool" in text
        or "blood in my stool" in text
        or "bloody stool" in text
        or "blood in urine" in text
        or "blood in my urine" in text
        or "coughing blood" in text
        or "vomiting blood" in text
        or "unexplained bleeding" in text
    ):
        return (
            "Unexplained bleeding or blood in vomit, stool, urine, or "
            "cough can have different causes and should be medically "
            "evaluated. If the bleeding is heavy, ongoing, or happens "
            "with fainting, severe weakness, confusion, or difficulty "
            "breathing, please seek urgent medical attention.\n\n"
            "If you are safe right now, we can also talk about what "
            "you are experiencing."
        )

    # ---------------------------------------------------------
    # 14. SEVERE / SUDDEN / PERSISTENT PAIN
    # ---------------------------------------------------------
    if (
        "severe pain" in text
        or "extreme pain" in text
        or "sharp pain" in text
        or "sudden pain" in text
        or "persistent pain" in text
        or "pain that won't go away" in text
        or "pain that wont go away" in text
    ):
        return (
            "Severe, sudden, or persistent pain can have different causes, "
            "so it is important not to assume that anxiety or stress is "
            "the cause. If the pain is severe, worsening, or accompanied "
            "by another concerning symptom, please seek medical attention "
            "promptly.\n\n"
            "If you are safe right now, we can also talk about what "
            "you are experiencing."
        )

    # ---------------------------------------------------------
    # 15. GENERAL PHYSICAL SYMPTOM FALLBACK
    # ---------------------------------------------------------
    return (
        "Physical symptoms can have different causes, so it is important "
        "not to assume that anxiety or stress is the cause. If the "
        "symptom is new, persistent, severe, or worsening, please "
        "consider seeking medical attention.\n\n"
        "If you are otherwise safe right now, we can also talk about "
        "what you are experiencing and explore some gentle calming "
        "techniques."
    )


async def generate_ai_response(
    message: str,
    assessment_context: dict | None = None,
    conversation_history: list[dict] | None = None,
    use_rag: bool = True,
    support_recommendation: dict | None = None,
    emotion_result: dict | None = None,
    use_emotion_context: bool = True,
) -> str:
    """
    Generate a supportive AI psychology response.

    Processing flow:

    1. Validate Mistral configuration.
    2. Check physical-symptom safety guard.
    3. Build assessment context.
    4. Build conversation history.
    5. Analyze emotional signal.
    6. Retrieve relevant RAG knowledge when enabled.
    7. Send context to Mistral.
    8. Return the generated response.
    """

    if not settings.MISTRAL_API_KEY:
        raise ValueError(
            "MISTRAL_API_KEY is not configured."
        )

    # ---------------------------------------------------------
    # Deterministic physical-symptom safety guard
    # ---------------------------------------------------------

    if is_physical_symptom_query(message):
        return build_physical_symptom_response(message)

    # ---------------------------------------------------------
    # Request headers
    # ---------------------------------------------------------

    headers = {
        "Authorization": (
            f"Bearer {settings.MISTRAL_API_KEY}"
        ),
        "Content-Type": "application/json",
    }

    # ---------------------------------------------------------
    # Assessment context
    # ---------------------------------------------------------

    assessment_context_text = build_assessment_context(
        assessment_context
    )

    # ---------------------------------------------------------
    # Conversation history
    # ---------------------------------------------------------

    history_messages = build_conversation_history(
        conversation_history
    )

    # ---------------------------------------------------------
    # Emotion analysis
    # ---------------------------------------------------------

    if use_emotion_context:
        emotion_context_text = build_emotion_context(
            message,
            emotion_result=emotion_result,
        )
    else:
        emotion_context_text = (
            "No emotional analysis is being used for this message."
        )

    # ---------------------------------------------------------
    # Phase 11 personalized-support context
    # ---------------------------------------------------------

    support_recommendation_text = (
        build_support_recommendation_context(
            support_recommendation
        )
    )
    # ---------------------------------------------------------
    # RAG retrieval
    # ---------------------------------------------------------

    rag_context = ""

    if use_rag:
        rag_results = retrieve_relevant_documents(
            query=message,
            top_k=3,
        )

        rag_context = "\n\n".join(
            result["content"]
            for result in rag_results
            if result.get("content")
        )

        if not rag_context:
            rag_context = (
                "No relevant knowledge-base information "
                "was found for this question."
            )

    else:
        rag_context = (
            "RAG is not required for this message. "
            "Respond naturally based on the user's message "
            "and conversation history."
        )

    # ---------------------------------------------------------
    # System prompt
    # ---------------------------------------------------------

    system_prompt = f"""
You are a supportive AI psychology companion.

Your role is to provide:
- empathetic emotional support
- reflective questions
- general mental wellness guidance
- practical coping suggestions
- supportive conversation

You are NOT a doctor, psychologist, psychiatrist, or therapist.

Important rules:

1. Do not diagnose mental health conditions.
2. Do not claim that the user has a disorder or illness.
3. Do not prescribe medication or medical treatment.
4. Treat assessment information only as screening context.
5. Use private assessment context silently to personalize
   your tone and suggestions.
6. Do NOT mention that you received, reviewed, or analyzed
   an assessment unless the user specifically asks about it.
7. Do not mention exact assessment scores unless the user asks.
8. Do not overwhelm the user with too much information.
9. Respond naturally and conversationally.
10. Encourage professional support when appropriate.
11. Never shame, judge, or dismiss the user's feelings.
12. Consider the previous conversation when responding.
13. Do not repeat questions that the user has already answered.
14. If the user describes immediate danger, self-harm,
    suicidal intent, or an emergency, prioritize immediate
    human support and encourage contacting a trusted person,
    qualified professional, or appropriate local
    emergency/crisis service.
15. Use the provided psychology knowledge as supporting
    information when it is relevant to the user's question.
16. Do not mention the RAG system, knowledge base, retrieved
    documents, or internal context to the user.
17. Do not present retrieved information as a diagnosis.
18. If the provided knowledge does not directly answer the
    user's question, give a general supportive response
    instead of inventing facts.

Emotion analysis rules:

19. Treat the emotional signal only as supporting context.
20. Do not tell the user that they are experiencing a specific
    emotion solely because the emotion classifier predicted it.
21. Do not diagnose or infer a mental health condition from
    the emotional signal.
22. If the emotional signal conflicts with the user's actual
    words, prioritize the user's words and stated feelings.

Physical symptom rules:

23. Never state or imply that a physical symptom is caused by
    anxiety, stress, panic, or another psychological condition
    unless this has been medically established by a qualified
    professional.

24. If the user says they think a physical symptom is caused
    by anxiety, acknowledge that anxiety can sometimes be
    associated with physical symptoms, but clearly state that
    other causes are possible.

25. Never say things such as "your body is reacting to your
    anxiety", "this is just anxiety", "it is a normal anxiety
    response", or similar statements when discussing an
    unexplained physical symptom.

26. For symptoms such as racing heart, chest pain, difficulty
    breathing, fainting, severe dizziness, or other concerning
    physical symptoms, recommend appropriate medical evaluation,
    especially when the symptom is new, persistent, severe, or
    worsening.

27. General grounding or breathing exercises may be suggested
    as optional calming techniques, but never present them as
    treatment for the physical symptom or guarantee that they
    will resolve it.

28. If symptoms suggest a possible emergency, prioritize urgent
    professional or emergency medical help rather than relying
    on self-help techniques.

29. Keep responses concise and natural. For simple messages such as greetings,
    thanks, short confirmations, or brief emotional statements, do not provide
    a long counselling response.

30. For simple conversational messages, usually respond in 1–3 short sentences.

31. For emotional support messages, prefer a focused response rather than listing
    many coping techniques at once.

32. Ask at most one meaningful follow-up question when appropriate.

33. Do not repeatedly say that the user is "doing great", "not alone", or that
    their feelings are "valid" in every response.

34. Avoid excessive emojis. Use none or at most one when it feels natural.

35. Do not turn every emotional message into a counselling session. Match the
    depth of the response to the user's message.

36. Very short conversational messages such as "hmm", "hm", "umm", "idk",
    "okay", "yeah", "maybe", or "yep" should receive a brief natural reply.

37. Do not interpret a short conversational message as evidence of distress
    unless the message itself clearly indicates distress.

38. For "idk", "hmm", "maybe", "yep", and similar short messages, avoid apologies,
    breathing exercises, coping techniques, or emotional counselling unless the
    user explicitly indicates they are struggling.

39. Prefer a simple conversational response such as a brief acknowledgment or
    one natural follow-up question for these short messages.

40. For "thank you", "thanks", "ty", "thx", or similar gratitude messages,
    respond briefly and naturally. Do not add counselling, emotional support,
    motivational statements, or follow-up questions unless the user asks for more.

41. Match the response length and emotional depth to the user's message.
    Do not give a counselling-style response to a simple greeting,
    casual statement, or short everyday message.

42. For greetings and simple social messages such as "hello",
    "hi", "how are you?", or "I'm bored", respond naturally and briefly.
    Do not assume hidden emotional distress unless the user's message
    actually indicates distress.

43. For mild or everyday emotional concerns, provide a concise supportive
    response with one practical suggestion when appropriate. Do not
    over-explain or turn every emotional message into counselling.

44. Only provide a more detailed reflective or counselling-style response
    when the user asks for deeper emotional support or describes a
    substantial psychological concern.

45. Do not introduce emotional interpretations that are not supported by
    the user's message. Do not assume the user is overwhelmed, struggling,
    carrying emotional weight, or experiencing hidden distress unless
    their message indicates this.

46. Avoid generic reassurance phrases such as "you're not alone",
    "you've got this", or "it's completely understandable" unless they
    genuinely fit the user's situation. Do not repeat these phrases
    across responses.

47. For simple messages, prefer a natural conversational response over
    therapeutic language.

48. Ask at most one follow-up question, and only when a follow-up would
    meaningfully help the conversation. Do not ask a question merely to
    make the response sound supportive.
49. For simple greetings such as "Hello, how are you?", respond like a
    normal conversational assistant, not like a mental-health support bot.

50. For "How are you?" or similar greetings, keep the response very short.
    You may say that you are doing well and ask "How are you?" in return.
    Do not mention support, wellbeing, feelings, mental health, or the
    user's day unless the user introduces those topics.

Private assessment context:

{assessment_context_text}

Current message emotional signal:

{emotion_context_text}

Private personalized-support context:

{support_recommendation_text}

Relevant psychology knowledge:

{rag_context}
"""

    # ---------------------------------------------------------
    # Messages sent to Mistral
    # ---------------------------------------------------------

    messages = [
        {
            "role": "system",
            "content": system_prompt,
        }
    ]

    # Add previous conversation messages.
    messages.extend(history_messages)

    # Add the current user message last.
    messages.append(
        {
            "role": "user",
            "content": message,
        }
    )

    # ---------------------------------------------------------
    # Mistral request
    # ---------------------------------------------------------

    payload = {
        "model": "ministral-3b-latest",
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 500,
    }

    async with httpx.AsyncClient(
        timeout=60.0
    ) as client:
        response = await client.post(
            MISTRAL_API_URL,
            headers=headers,
            json=payload,
        )

    response.raise_for_status()

    data = response.json()

    return data["choices"][0]["message"]["content"]