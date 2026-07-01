from fastapi import APIRouter

router = APIRouter(tags=["excel"])


@router.get("/jobs")
def list_excel_jobs() -> list[dict[str, str]]:
    return []
