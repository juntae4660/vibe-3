import sqlite3
from collections.abc import Sequence
from datetime import datetime
from typing import Any


def _row_to_dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    return dict(row) if row is not None else None


def list_members(connection: sqlite3.Connection) -> list[dict[str, Any]]:
    rows = connection.execute(
        """
        SELECT id, name, department, position, email, phone, is_active, created_at, updated_at
        FROM team_members
        ORDER BY is_active DESC, name ASC, id DESC
        """
    ).fetchall()
    return [dict(row) for row in rows]


def get_member(connection: sqlite3.Connection, member_id: int) -> dict[str, Any] | None:
    row = connection.execute(
        """
        SELECT id, name, department, position, email, phone, is_active, created_at, updated_at
        FROM team_members
        WHERE id = ?
        """,
        (member_id,),
    ).fetchone()
    return _row_to_dict(row)


def create_member(
    connection: sqlite3.Connection,
    payload: dict[str, Any],
) -> dict[str, Any]:
    cursor = connection.execute(
        """
        INSERT INTO team_members (name, department, position, email, phone)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            payload["name"],
            payload.get("department"),
            payload.get("position"),
            payload.get("email"),
            payload.get("phone"),
        ),
    )
    connection.commit()
    member = get_member(connection, cursor.lastrowid)
    if member is None:
        raise RuntimeError("Created member was not found.")
    return member


def update_member(
    connection: sqlite3.Connection,
    member_id: int,
    payload: dict[str, Any],
) -> dict[str, Any] | None:
    if not payload:
        return get_member(connection, member_id)

    assignments = [f"{key} = ?" for key in payload]
    values = list(payload.values())
    values.append(member_id)
    connection.execute(
        f"""
        UPDATE team_members
        SET {", ".join(assignments)}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        values,
    )
    connection.commit()
    return get_member(connection, member_id)


def deactivate_member(connection: sqlite3.Connection, member_id: int) -> dict[str, Any] | None:
    connection.execute(
        """
        UPDATE team_members
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (member_id,),
    )
    connection.commit()
    return get_member(connection, member_id)


def list_events(
    connection: sqlite3.Connection,
    start_date: str | None = None,
    end_date: str | None = None,
    member_id: int | None = None,
) -> list[dict[str, Any]]:
    clauses: list[str] = []
    params: list[Any] = []

    if start_date is not None:
        clauses.append("e.ends_at >= ?")
        params.append(start_date)
    if end_date is not None:
        clauses.append("e.starts_at <= ?")
        params.append(end_date)
    if member_id is not None:
        clauses.append("e.member_id = ?")
        params.append(member_id)

    where_clause = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    rows = connection.execute(
        f"""
        SELECT
            e.id,
            e.member_id,
            COALESCE(m.name, '미지정') AS member_name,
            e.title,
            e.event_type,
            e.starts_at,
            e.ends_at,
            e.location,
            e.memo,
            e.created_at,
            e.updated_at
        FROM calendar_events e
        LEFT JOIN team_members m ON m.id = e.member_id
        {where_clause}
        ORDER BY e.starts_at ASC, e.id ASC
        """,
        params,
    ).fetchall()
    return [dict(row) for row in rows]


def get_event(connection: sqlite3.Connection, event_id: int) -> dict[str, Any] | None:
    rows = list_events(connection)
    for row in rows:
        if row["id"] == event_id:
            return row
    return None


def create_event(
    connection: sqlite3.Connection,
    payload: dict[str, Any],
) -> dict[str, Any]:
    cursor = connection.execute(
        """
        INSERT INTO calendar_events (
            member_id, title, event_type, starts_at, ends_at, location, memo
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload["member_id"],
            payload["title"],
            payload["event_type"],
            _serialize_datetime(payload["starts_at"]),
            _serialize_datetime(payload["ends_at"]),
            payload.get("location"),
            payload.get("memo"),
        ),
    )
    connection.commit()
    event = get_event(connection, cursor.lastrowid)
    if event is None:
        raise RuntimeError("Created event was not found.")
    return event


def update_event(
    connection: sqlite3.Connection,
    event_id: int,
    payload: dict[str, Any],
) -> dict[str, Any] | None:
    if not payload:
        return get_event(connection, event_id)

    normalized = {
        key: _serialize_datetime(value) if isinstance(value, datetime) else value
        for key, value in payload.items()
    }
    assignments = [f"{key} = ?" for key in normalized]
    values: Sequence[Any] = [*normalized.values(), event_id]
    connection.execute(
        f"""
        UPDATE calendar_events
        SET {", ".join(assignments)}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        values,
    )
    connection.commit()
    return get_event(connection, event_id)


def delete_event(connection: sqlite3.Connection, event_id: int) -> bool:
    cursor = connection.execute("DELETE FROM calendar_events WHERE id = ?", (event_id,))
    connection.commit()
    return cursor.rowcount > 0


def _serialize_datetime(value: datetime) -> str:
    return value.isoformat()
