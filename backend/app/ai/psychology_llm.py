import os
from fastapi import HTTPException, status
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_mistralai import ChatMistralAI

# Psychological prompt
PSYCHOLOGIST_SYSTEM_PROMPT = """You are a compassionate, empathetic, and professional AI Mental Health & Psychology Assistant.
Your primary role is to listen attentively, validate feelings, offer supportive guidance, and ask gentle reflective questions.

Strict Safety Rules:
1. Do not give clinical diagnoses or prescribe medication.
2. If the user mentions suicide, self-harm, or severe distress, kindly urge them to contact local emergency services or immediate mental health crisis helplines.
3. Keep responses non-judgmental, warm, and well-structured."""


def get_mistral_llm():
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="MISTRAL_API_KEY environment variable is not configured in backend."
        )
    
    # Ministral 8b ya ministral-3b model use kar sakte hain
    return ChatMistralAI(
        api_key=api_key,
        model="ministral-8b-latest",  # ya "ministral-3b-latest"
        temperature=0.7,
        max_tokens=1024
    )


def generate_psychology_response(history_messages: list) -> str:
    llm = get_mistral_llm()
    formatted_messages = [SystemMessage(content=PSYCHOLOGIST_SYSTEM_PROMPT)]

    for msg in history_messages:
        if msg.sender == "user":
            formatted_messages.append(HumanMessage(content=msg.content))
        elif msg.sender == "assistant":
            formatted_messages.append(AIMessage(content=msg.content))

    try:
        response = llm.invoke(formatted_messages)
        return str(response.content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Mistral AI Engine Error: {str(e)}"
        )