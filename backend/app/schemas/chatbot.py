from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ManualRecord(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: int
    filename: str
    original_filename: str = Field(alias="originalFilename")
    page_count: int = Field(alias="pageCount")
    chunk_count: int = Field(alias="chunkCount")
    created_at: str = Field(alias="createdAt")


class ManualUploadResponse(ManualRecord):
    pass


class ChatQuestionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    question: str = Field(min_length=1, max_length=4000)
    manual_id: int | None = Field(default=None, alias="manualId")


class ChatSource(BaseModel):
    page: int
    chunk: int
    preview: str


class ChatAnswerResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: int
    manual_id: int | None = Field(alias="manualId")
    question: str
    answer: str
    sources: list[ChatSource]
    created_at: str = Field(alias="createdAt")


class ChatHistoryItem(ChatAnswerResponse):
    manual_filename: str | None = Field(default=None, alias="manualFilename")
