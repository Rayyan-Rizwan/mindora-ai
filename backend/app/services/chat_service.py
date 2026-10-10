from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.mood import MoodRecord

from app.services.response_guardrail_service import (
    validate_generated_response,
)

from app.models.assessment import Assessment
from app.models.conversation import Conversation
from app.models.enums import AssessmentStatus, SenderType
from app.models.message import Message
from app.services.personalized_support_service import (
    build_support_recommendation,
)
from app.services.mistral_service import (
    generate_ai_response,
    is_physical_symptom_query,
    build_physical_symptom_response,
    get_emotion_result,
)

from app.services.psychology_router import (
    is_psychology_query,
    is_general_conversation,
)

# ---------------------------------------------------------
# SAFETY SERVICES
# ---------------------------------------------------------

from app.services.risk_detection_service import (
    detect_contextual_risk,
)

from app.services.safety_response_service import (
    build_safety_response,
)


def get_latest_assessment_context(
    db: Session,
    user_id: UUID,
) -> dict | None:
    """
    Get the latest completed initial wellness assessment
    for the authenticated user.

    The returned data is structured screening context only.
    It is not treated as a diagnosis.
    """

    assessment = (
        db.query(Assessment)
        .filter(
            Assessment.user_id == user_id,
            Assessment.assessment_type == "initial_wellness",
            Assessment.status == AssessmentStatus.COMPLETED,
        )
        .order_by(Assessment.completed_at.desc())
        .first()
    )

    if not assessment or not assessment.result:
        return None

    result_data = assessment.result.result_data

    if not result_data:
        return None

    return {
        "wellbeing": result_data.get("who5", {}).get("level"),
        "anxiety": result_data.get("gad7", {}).get("severity_level"),
        "mood": result_data.get("mood", {}).get("level"),
        "stress": result_data.get("stress", {}).get("level"),
        "overall": result_data.get("overall", {}).get("level"),
        "safety_flag": result_data.get("safety", {}).get(
            "risk_flag",
            False,
        ),
    }


def get_conversation_history_for_ai(
    db: Session,
    conversation_id: UUID,
) -> list[dict]:
    """
    Get previous conversation messages in the format
    required by the Mistral chat completion API.

    The current user message is intentionally excluded.
    """

    messages = (
        db.query(Message)
        .filter(
            Message.conversation_id == conversation_id,
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    history = []

    for message in messages:
        if message.sender == SenderType.USER:
            role = "user"

        elif message.sender == SenderType.AI:
            role = "assistant"

        else:
            continue

        history.append(
            {
                "role": role,
                "content": message.content,
            }
        )

    return history

def get_recent_mood_history(
    db: Session,
    user_id: UUID,
    limit: int = 5,
) -> list[int]:
    """
    Get the user's most recent mood scores.

    Mood history is used only as a wellness personalization
    signal. It is not a diagnosis or clinical assessment.
    """

    mood_records = (
        db.query(MoodRecord)
        .filter(
            MoodRecord.user_id == user_id
        )
        .order_by(
            desc(MoodRecord.created_at)
        )
        .limit(limit)
        .all()
    )

    return [
        record.mood_score
        for record in mood_records
        if record.mood_score is not None
    ]



async def process_chat_interaction(
    db: Session,
    user_id: UUID,
    message_content: str,
    conversation_id: UUID | None = None,
):
    """
    Process a chatbot message for the authenticated user.

    Routing priority:

    1. Physical symptom safety
    2. Mental-health risk safety
    3. General conversation -> Mistral WITHOUT RAG
    4. Psychology / mental wellness -> RAG + Mistral
    5. Unrelated question -> existing psychology redirect

    The existing conversation history, assessment context,
    database storage, NLP/emotion analysis and safety services
    are preserved.
    """

    print("DEBUG CHAT SERVICE MESSAGE:", message_content)

    # ---------------------------------------------------------
    # 1. Get existing conversation or create a new one
    # ---------------------------------------------------------

    if conversation_id:
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
            .first()
        )

        if not conversation:
            raise ValueError("Conversation not found.")

    else:
        conversation = Conversation(
            user_id=user_id,
        )

        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # ---------------------------------------------------------
    # 2. Get previous conversation history
    # ---------------------------------------------------------

    conversation_history = get_conversation_history_for_ai(
        db=db,
        conversation_id=conversation.id,
    )

    # ---------------------------------------------------------
    # 3. Get latest assessment context
    # ---------------------------------------------------------

    assessment_context = get_latest_assessment_context(
        db=db,
        user_id=user_id,
    )

    # ---------------------------------------------------------
    # 4. Save current user's message
    # ---------------------------------------------------------

    user_message = Message(
        conversation_id=conversation.id,
        sender=SenderType.USER,
        content=message_content,
    )

    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    # ---------------------------------------------------------
    # 5. Mental-health risk detection
    # ---------------------------------------------------------

    recent_user_messages = [
        item["content"]
        for item in conversation_history[-5:]
        if item.get("role") == "user"
    ]

    risk_result = detect_contextual_risk(
        current_message=message_content,
        recent_messages=recent_user_messages,
    )

    safety_response = build_safety_response(
        risk_result
    )

    print("DEBUG risk result:", risk_result)
    print("DEBUG safety response:", safety_response)

    # ---------------------------------------------------------
    # 5A. Physical symptom safety
    # ---------------------------------------------------------
    # ---------------------------------------------------------
# PHASE 11 - PERSONALIZED SUPPORT
# ---------------------------------------------------------
    mood_history = get_recent_mood_history(
        db=db,
        user_id=user_id,
    )

    emotion_result = get_emotion_result(
        message_content
    )

    support_recommendation = build_support_recommendation(
        {
            "risk_result": risk_result,
            "assessment_context": assessment_context,
            "emotion": (
                emotion_result.get("emotion")
                if emotion_result
                else None
            ),
            "mood_history": mood_history,
        }
    ) 

    

    if is_physical_symptom_query(message_content):

        # Physical symptoms bypass:
        # - Mistral
        # - RAG
        # - emotion analysis
        #
        # Dedicated physical symptom safety response is used.

        ai_response_text = build_physical_symptom_response(
            message_content
        )

    # ---------------------------------------------------------
    # 5B. Mental-health risk safety
    # ---------------------------------------------------------

    elif safety_response is not None:

        # HIGH / MODERATE risk responses bypass:
        # - Mistral
        # - RAG
        # - emotion analysis
        #
        # Deterministic safety response is used.

        ai_response_text = safety_response

    # ---------------------------------------------------------
    # 5C. General conversation
    # ---------------------------------------------------------

    elif (
    is_general_conversation(message_content)
    or message_content.strip().lower() in {
        "hi",
        "hello",
        "hey",
        "hi there",
        "hello there",
        "hey there",
        "i'm good",
        "im good",
        "i am good",
        "i'm fine",
        "im fine",
        "i am fine",
        "good",
        "fine",
        "thanks",
        "thank you",
        "thx",
        "thanks a lot",
        "okay",
        "ok",
        "alright",
        "sure",
        "idk",
        "i don't know",
        "i dont know",
        "i do not know",
        "hmm",
        "hmmm",
        "hm",
        "i'm bored",
        "im bored",
        "i am bored",
        "bored",
    }
):
        # General conversation goes directly to Mistral.
        # RAG is disabled here.

        normalized_message = message_content.strip().lower()

        if normalized_message in {
            "hi",
            "hello",
            "hey",
            "hi there",
            "hello there",
            "hey there",
        }:
            ai_response_text = (
                "Hey! How can I help you today?"
            )

        elif normalized_message in {
            "hello, how are you?",
            "hi, how are you?",
            "hey, how are you?",
            "hello how are you",
            "hi how are you",
            "hey how are you",
        }:
            ai_response_text = (
                "Hi! I'm doing well, thanks for asking. How are you?"
            )

        elif normalized_message in {
            "i'm good",
            "im good",
            "i am good",
            "i'm fine",
            "im fine",
            "i am fine",
            "good",
            "fine",
        }:
            ai_response_text = (
                "Glad to hear that! 😊 What are you up to?"
            )

        elif normalized_message in {
            "i'm bored",
            "im bored",
            "i am bored",
            "bored",
        }:
            ai_response_text = (
                "Bored, huh? 😄 Want me to give you a few things "
                "you could do?"
            )

        elif normalized_message in {
            "thanks",
            "thank you",
            "thx",
            "thanks a lot",
        }:
            ai_response_text = (
                "You're welcome! 😊"
            )

        elif normalized_message in {
            "okay",
            "ok",
            "alright",
            "sure",
        }:
            ai_response_text = (
                "Alright! 👍"
            )

        elif normalized_message in {
            "idk",
            "i don't know",
            "i dont know",
            "i do not know",
        }:
            ai_response_text = (
                "That's okay. Take your time."
            )

        elif normalized_message in {
            "hmm",
            "hmmm",
            "hm",
        }:
            ai_response_text = (
                "Hmm 😊"
            )

        else:
            ai_response_text = await generate_ai_response(
                message=message_content,
                assessment_context=None,
                conversation_history=conversation_history,
                use_rag=False,
                support_recommendation=None,
                emotion_result=None,
                use_emotion_context=False,
            )

        # General conversation goes directly to Mistral.
        #
        # RAG is disabled here.
        #
        # Examples:
        # "Hi"
        # "How are you?"
        # "I'm bored"
        # "I'm having a bad day"
        # "I'm really tired"
        # "Thanks"
        if message_content.strip().lower() in {
            "hi",
            "hello",
            "hey",
            "hi there",
            "hello there",
            "hey there",
        }:
            ai_response_text = (
                "Hey! How can I help you today?"
            )
        if message_content.strip().lower() in {
            "hello, how are you?",
            "hi, how are you?",
            "hey, how are you?",
            "hello how are you",
            "hi how are you",
            "hey how are you",
        }:
            ai_response_text = (
                "Hi! I'm doing well, thanks for asking. How are you?"
            )

        else:
            ai_response_text = await generate_ai_response(
            message=message_content,
            assessment_context=None,
            conversation_history=conversation_history,
            use_rag=False,
            support_recommendation=None,
            emotion_result=None,
            use_emotion_context=False,
        )

    # ---------------------------------------------------------
    # 5D. Psychology / mental wellness
    # ---------------------------------------------------------

    elif is_psychology_query(message_content):

        # Psychology-related messages use:
        #
        # NLP / emotion analysis
        # +
        # RAG
        # +
        # Mistral
        #
        # If relevant RAG information exists, it can be used.
        # If no relevant RAG information exists, Mistral
        # provides a general psychology response.

        ai_response_text = await generate_ai_response(
            message=message_content,
            assessment_context=assessment_context,
            conversation_history=conversation_history,
            use_rag=True,
            support_recommendation=support_recommendation,
            emotion_result=emotion_result,
        )

    # ---------------------------------------------------------
    # 5E. Other questions
# ---------------------------------------------------------

    else:

    # Allow Mistral to answer questions that are not classified
    # as psychology-specific.
    #
    # Safety and physical-symptom checks have already happened
    # above, so this fallback can safely use the normal AI flow.

        ai_response_text = await generate_ai_response(
         message=message_content,
         assessment_context=None,
         conversation_history=conversation_history,
         use_rag=False,
         support_recommendation=None,
         emotion_result=None,
         use_emotion_context=False,
        )
    # ---------------------------------------------------------
# PHASE 11 - RESPONSE GUARDRAIL
# ---------------------------------------------------------

    guardrail_result = validate_generated_response(
        response=ai_response_text,
        risk_result=risk_result,
    )

    if not guardrail_result["safe"]:
        print(
            "DEBUG response guardrail:",
            guardrail_result,
        )

        if safety_response:
            ai_response_text = safety_response
    # ---------------------------------------------------------
    # 6. Save AI response
    # ---------------------------------------------------------

    ai_message = Message(
        conversation_id=conversation.id,
        sender=SenderType.AI,
        content=ai_response_text,
    )

    db.add(ai_message)
    db.commit()
    db.refresh(ai_message)

    return conversation.id, user_message, ai_message


async def get_user_conversation_history(
    db: Session,
    user_id: UUID,
    conversation_id: UUID,
):
    """
    Retrieve the conversation history for the authenticated user.
    """

    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
        .first()
    )

    if not conversation:
        raise ValueError("Conversation not found.")

    messages = (
        db.query(Message)
        .filter(
            Message.conversation_id == conversation_id,
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    return {
        "id": conversation.id,
        "title": conversation.title,
        "started_at": conversation.started_at,
        "messages": messages,
    }