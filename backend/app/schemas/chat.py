
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=4096,
        description="User question or prompt"
    )
    conversation_id: Optional[UUID] = Field(
        None,
        description="Existing session UUID. Leave null to start a new chat session."
    )


class MessageResponse(BaseModel):
    id: UUID
    sender: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    conversation_id: UUID
    user_message: MessageResponse
    ai_response: MessageResponse


class ConversationHistoryResponse(BaseModel):
    id: UUID
    title: Optional[str] = None
    started_at: datetime
    messages: List[MessageResponse]

    class Config:
        from_attributes = True
