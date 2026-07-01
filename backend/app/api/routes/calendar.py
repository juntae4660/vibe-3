from fastapi import APIRouter

router = APIRouter(tags=["calendar"])


@router.get("/events")
def list_events() -> list[dict[str, str]]:
    return []
