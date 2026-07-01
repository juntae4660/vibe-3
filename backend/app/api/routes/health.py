from fastapi import APIRouter

router = APIRouter(tags=["system"])


@router.get("/health")
def health_check() -> dict[str, str]:
    return {
        "service": "backend",
        "status": "ok",
        "detail": "FastAPI backend is reachable.",
    }
