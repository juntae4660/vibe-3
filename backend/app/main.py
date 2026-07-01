from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import calendar, chatbot, db, excel, health, news
from app.core.database import initialize_database

app = FastAPI(title="Public Administration Super App API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(db.router, prefix="/api/db")
app.include_router(calendar.router, prefix="/api/calendar")
app.include_router(excel.router, prefix="/api/excel")
app.include_router(chatbot.router, prefix="/api/chatbot")
app.include_router(news.router, prefix="/api/news")


@app.on_event("startup")
def on_startup() -> None:
    initialize_database()
