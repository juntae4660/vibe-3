from fastapi import APIRouter, File, Header, UploadFile, status

from app.schemas.chatbot import (
    ChatAnswerResponse,
    ChatHistoryItem,
    ChatQuestionRequest,
    ManualUploadResponse,
)
from app.services import chatbot_service

router = APIRouter(tags=["chatbot"])


@router.get("/manuals", response_model=list[ManualUploadResponse])
def list_manuals() -> list[dict]:
    return chatbot_service.list_manuals()


@router.post("/manuals", response_model=ManualUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_manual(
    file: UploadFile = File(...),
    x_openai_api_key: str | None = Header(default=None, alias="X-OpenAI-Api-Key"),
) -> dict:
    return chatbot_service.upload_manual(file, x_openai_api_key)


@router.post("/respond", response_model=ChatAnswerResponse)
def respond(
    payload: ChatQuestionRequest,
    x_openai_api_key: str | None = Header(default=None, alias="X-OpenAI-Api-Key"),
) -> dict:
    return chatbot_service.answer_question(payload, x_openai_api_key)


@router.get("/history", response_model=list[ChatHistoryItem])
def list_chatbot_history(limit: int = 20) -> list[dict]:
    return chatbot_service.list_history(limit=limit)
