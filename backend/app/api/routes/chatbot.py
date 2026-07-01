from fastapi import APIRouter

router = APIRouter(tags=["chatbot"])


@router.get("/history")
def list_chatbot_history() -> list[dict[str, str]]:
    return []
