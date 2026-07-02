import sqlite3
from collections.abc import Iterator

from app.core.config import DATABASE_PATH, DATA_DIR


def get_connection() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def connection_context() -> Iterator[sqlite3.Connection]:
    connection = get_connection()
    try:
        yield connection
    finally:
        connection.close()


def initialize_database() -> None:
    with get_connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS health_checks (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                status TEXT NOT NULL,
                checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            INSERT INTO health_checks (id, status)
            VALUES (1, 'ok')
            ON CONFLICT(id) DO UPDATE SET
                status = excluded.status,
                checked_at = CURRENT_TIMESTAMP;

            CREATE TABLE IF NOT EXISTS team_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                department TEXT,
                position TEXT,
                email TEXT,
                phone TEXT,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT
            );

            CREATE TABLE IF NOT EXISTS calendar_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                member_id INTEGER,
                title TEXT NOT NULL,
                event_type TEXT NOT NULL,
                starts_at TEXT NOT NULL,
                ends_at TEXT NOT NULL,
                location TEXT,
                memo TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT,
                FOREIGN KEY(member_id) REFERENCES team_members(id)
            );

            CREATE TABLE IF NOT EXISTS excel_jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_type TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS complaint_responses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                manual_id INTEGER,
                question_text TEXT NOT NULL,
                response_text TEXT NOT NULL,
                sources_json TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS complaint_manuals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                original_filename TEXT NOT NULL,
                stored_path TEXT NOT NULL,
                vectorstore_path TEXT NOT NULL,
                page_count INTEGER NOT NULL DEFAULT 0,
                chunk_count INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS news_articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                source TEXT NOT NULL,
                summary TEXT,
                published_at TEXT,
                url TEXT NOT NULL,
                category TEXT,
                collected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            """
        )
        _ensure_column(connection, "complaint_responses", "manual_id", "INTEGER")
        _ensure_column(connection, "complaint_responses", "question_text", "TEXT")
        _ensure_column(connection, "complaint_responses", "sources_json", "TEXT")
        _ensure_column(connection, "complaint_manuals", "page_count", "INTEGER")
        _ensure_column(connection, "complaint_manuals", "chunk_count", "INTEGER")
        _ensure_column(connection, "calendar_events", "member_id", "INTEGER")
        _ensure_column(connection, "calendar_events", "location", "TEXT")
        _ensure_column(connection, "calendar_events", "memo", "TEXT")
        _ensure_column(connection, "calendar_events", "updated_at", "TEXT")
        _ensure_column(connection, "news_articles", "summary", "TEXT")
        _ensure_column(connection, "news_articles", "published_at", "TEXT")
        _ensure_column(connection, "news_articles", "category", "TEXT")


def _ensure_column(
    connection: sqlite3.Connection,
    table_name: str,
    column_name: str,
    column_definition: str,
) -> None:
    columns = {
        row["name"]
        for row in connection.execute(f"PRAGMA table_info({table_name})").fetchall()
    }
    if column_name not in columns:
        connection.execute(
            f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}"
        )
