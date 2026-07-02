from fastapi import APIRouter, Query

from app.schemas.news import NewsArticle, NewsCollectionRequest, NewsCollectionResponse
from app.services import news_service

router = APIRouter(tags=["news"])


@router.get("", response_model=list[NewsArticle])
def list_news(
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
) -> list[dict]:
    return news_service.list_articles(start_date=start_date, end_date=end_date, limit=limit)


@router.post("/collect", response_model=NewsCollectionResponse)
def collect_news(payload: NewsCollectionRequest) -> dict:
    return news_service.collect_target_date(payload.target_date)


@router.post("/collect/recent", response_model=NewsCollectionResponse)
def collect_recent_news() -> dict:
    return news_service.collect_since_yesterday()
