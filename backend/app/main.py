from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute

from app.api.routes import calendar, chatbot, db, excel, health, news
from app.core.database import initialize_database
from app.core.scheduler import start_scheduler

app = FastAPI(title="Public Administration Super App API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def include_router_routes(module_router, prefix: str) -> None:
    for route in module_router.routes:
        if not isinstance(route, APIRoute):
            continue
        app.add_api_route(
            f"{prefix}{route.path}",
            route.endpoint,
            methods=route.methods,
            name=route.name,
            response_model=route.response_model,
            status_code=route.status_code,
            tags=route.tags,
        )


include_router_routes(health.router, prefix="/api")
include_router_routes(db.router, prefix="/api/db")
include_router_routes(calendar.router, prefix="/api/calendar")
include_router_routes(excel.router, prefix="/api/excel")
include_router_routes(chatbot.router, prefix="/api/chatbot")
include_router_routes(news.router, prefix="/api/news")


@app.on_event("startup")
def on_startup() -> None:
    initialize_database()
    start_scheduler()
