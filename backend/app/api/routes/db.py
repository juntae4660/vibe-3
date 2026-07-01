from fastapi import APIRouter, HTTPException

from app.core.config import DATABASE_PATH
from app.core.database import get_connection, initialize_database

router = APIRouter(tags=["database"])


@router.get("/health")
def database_health_check() -> dict[str, str]:
    try:
        initialize_database()
        with get_connection() as connection:
            row = connection.execute("SELECT status FROM health_checks WHERE id = 1").fetchone()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"SQLite connection failed: {exc}") from exc

    if row is None:
        raise HTTPException(status_code=500, detail="SQLite health row was not initialized.")

    return {
        "service": "sqlite",
        "status": row["status"],
        "detail": f"SQLite database is reachable at {DATABASE_PATH}.",
    }
