import sqlite3
from typing import Any


def list_articles(
    connection: sqlite3.Connection,
    start_date: str | None = None,
    end_date: str | None = None,
    limit: int = 100,
) -> list[dict[str, Any]]:
    clauses: list[str] = []
    params: list[Any] = []

    if start_date:
        clauses.append("published_at >= ?")
        params.append(start_date)
    if end_date:
        clauses.append("published_at <= ?")
        params.append(end_date)

    where_clause = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    rows = connection.execute(
        f"""
        SELECT id, title, source, summary, published_at, url, category, collected_at
        FROM news_articles
        {where_clause}
        ORDER BY COALESCE(published_at, collected_at) DESC, id DESC
        LIMIT ?
        """,
        [*params, limit],
    ).fetchall()
    return [dict(row) for row in rows]


def create_article_if_missing(
    connection: sqlite3.Connection,
    payload: dict[str, Any],
) -> tuple[dict[str, Any], bool]:
    existing = get_article_by_url(connection, payload["url"])
    if existing is not None:
        return existing, False

    cursor = connection.execute(
        """
        INSERT INTO news_articles (
            title, source, summary, published_at, url, category
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            payload["title"],
            payload["source"],
            payload.get("summary"),
            payload.get("published_at"),
            payload["url"],
            payload.get("category"),
        ),
    )
    connection.commit()
    row = connection.execute(
        """
        SELECT id, title, source, summary, published_at, url, category, collected_at
        FROM news_articles
        WHERE id = ?
        """,
        (cursor.lastrowid,),
    ).fetchone()
    if row is None:
        raise RuntimeError("Created news article was not found.")
    return dict(row), True


def get_article_by_url(connection: sqlite3.Connection, url: str) -> dict[str, Any] | None:
    row = connection.execute(
        """
        SELECT id, title, source, summary, published_at, url, category, collected_at
        FROM news_articles
        WHERE url = ?
        """,
        (url,),
    ).fetchone()
    return dict(row) if row is not None else None
