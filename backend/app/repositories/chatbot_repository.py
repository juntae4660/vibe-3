import sqlite3
from typing import Any


def list_manuals(connection: sqlite3.Connection) -> list[dict[str, Any]]:
    rows = connection.execute(
        """
        SELECT id, filename, original_filename, stored_path, vectorstore_path, page_count, chunk_count, created_at
        FROM complaint_manuals
        ORDER BY id DESC
        """
    ).fetchall()
    return [dict(row) for row in rows]


def get_manual(connection: sqlite3.Connection, manual_id: int) -> dict[str, Any] | None:
    row = connection.execute(
        """
        SELECT id, filename, original_filename, stored_path, vectorstore_path, page_count, chunk_count, created_at
        FROM complaint_manuals
        WHERE id = ?
        """,
        (manual_id,),
    ).fetchone()
    return dict(row) if row is not None else None


def create_manual(connection: sqlite3.Connection, payload: dict[str, Any]) -> dict[str, Any]:
    cursor = connection.execute(
        """
        INSERT INTO complaint_manuals (
            filename, original_filename, stored_path, vectorstore_path, page_count, chunk_count
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            payload["filename"],
            payload["original_filename"],
            payload["stored_path"],
            payload["vectorstore_path"],
            payload["page_count"],
            payload["chunk_count"],
        ),
    )
    connection.commit()
    manual = get_manual(connection, cursor.lastrowid)
    if manual is None:
        raise RuntimeError("Created complaint manual was not found.")
    return manual


def create_chat_response(connection: sqlite3.Connection, payload: dict[str, Any]) -> dict[str, Any]:
    cursor = connection.execute(
        """
        INSERT INTO complaint_responses (
            manual_id, question_text, response_text, sources_json
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            payload.get("manual_id"),
            payload["question_text"],
            payload["response_text"],
            payload.get("sources_json"),
        ),
    )
    connection.commit()
    return get_chat_response(connection, cursor.lastrowid)


def get_chat_response(connection: sqlite3.Connection, response_id: int) -> dict[str, Any] | None:
    row = connection.execute(
        """
        SELECT
            r.id,
            r.manual_id,
            r.question_text,
            r.response_text,
            r.sources_json,
            r.created_at,
            m.filename AS manual_filename
        FROM complaint_responses r
        LEFT JOIN complaint_manuals m ON m.id = r.manual_id
        WHERE r.id = ?
        """,
        (response_id,),
    ).fetchone()
    return dict(row) if row is not None else None


def list_chat_history(connection: sqlite3.Connection, limit: int = 20) -> list[dict[str, Any]]:
    rows = connection.execute(
        """
        SELECT
            r.id,
            r.manual_id,
            r.question_text,
            r.response_text,
            r.sources_json,
            r.created_at,
            m.filename AS manual_filename
        FROM complaint_responses r
        LEFT JOIN complaint_manuals m ON m.id = r.manual_id
        ORDER BY r.id DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    return [dict(row) for row in rows]
