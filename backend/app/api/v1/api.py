from fastapi import APIRouter

from app.api.v1 import auth, users
from app.api.v1.assessment import router as assessment_router
from app.api.v1.endpoints import chat
from app.api.v1.mood import router as mood_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.professionals import router as professionals_router


api_router = APIRouter()


api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["auth"],
)

api_router.include_router(
    users.router,
    prefix="/users",
    tags=["users"],
)

api_router.include_router(
    chat.router,
    tags=["AI Psychology Chatbot"],
)

api_router.include_router(
    assessment_router,
)

api_router.include_router(
    mood_router,
)

api_router.include_router(
    notifications_router
)

api_router.include_router(
    professionals_router,
    prefix="/professionals",
    tags=["Professionals"],
)