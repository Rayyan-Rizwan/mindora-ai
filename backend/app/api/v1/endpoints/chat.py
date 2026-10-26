from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.api.v1.deps import get_current_user
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationHistoryResponse,
    ConversationSummaryResponse,
    MessageResponse,
)
from app.services.chat_service import (
    process_chat_interaction,
    get_user_conversations,
    get_user_conversation_history,
)


router = APIRouter(
    prefix="/chat",
    tags=["AI Psychology Chatbot"]
)


@router.post("", response_model=ChatResponse)
async def send_chat_message(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        conv_id, user_msg, ai_msg = await process_chat_interaction(
            db=db,
            user_id=current_user.id,
            message_content=payload.message,
            conversation_id=payload.conversation_id
        )

        return ChatResponse(
            conversation_id=conv_id,
            user_message=MessageResponse.model_validate(user_msg),
            ai_response=MessageResponse.model_validate(ai_msg)
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


@router.get(
    "/conversations",
    response_model=list[ConversationSummaryResponse]
)
async def list_chat_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_user_conversations(
        db=db,
        user_id=current_user.id
    )


@router.get(
    "/history/{conversation_id}",
    response_model=ConversationHistoryResponse
)
async def fetch_chat_history(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return await get_user_conversation_history(
            db=db,
            user_id=current_user.id,
            conversation_id=conversation_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )