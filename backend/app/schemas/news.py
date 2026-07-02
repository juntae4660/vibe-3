from pydantic import BaseModel, ConfigDict, Field


class NewsArticle(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: int
    title: str
    source: str
    summary: str | None = None
    published_at: str | None = Field(default=None, alias="publishedAt")
    url: str
    category: str | None = None
    collected_at: str = Field(alias="collectedAt")


class NewsCollectionRequest(BaseModel):
    target_date: str = Field(alias="targetDate", pattern=r"^\d{4}-\d{2}-\d{2}$")


class NewsCollectionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    target_date: str = Field(alias="targetDate")
    collected_count: int = Field(alias="collectedCount")
    inserted_count: int = Field(alias="insertedCount")
    skipped_count: int = Field(alias="skippedCount")
    articles: list[NewsArticle]
