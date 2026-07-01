from fastapi import APIRouter

router = APIRouter(tags=["news"])


@router.get("")
def list_news() -> list[dict[str, str]]:
    return []
