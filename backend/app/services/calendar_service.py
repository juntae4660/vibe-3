from datetime import datetime

from fastapi import HTTPException, status

from app.core.database import get_connection
from app.repositories import calendar_repository
from app.schemas.calendar import (
    CalendarEventCreate,
    CalendarEventUpdate,
    TeamMemberCreate,
    TeamMemberUpdate,
)


def list_members() -> list[dict]:
    with get_connection() as connection:
        return calendar_repository.list_members(connection)


def create_member(payload: TeamMemberCreate) -> dict:
    data = _strip_text_fields(payload.model_dump())
    with get_connection() as connection:
        return calendar_repository.create_member(connection, data)


def update_member(member_id: int, payload: TeamMemberUpdate) -> dict:
    data = _strip_text_fields(payload.model_dump(exclude_unset=True))
    with get_connection() as connection:
        member = calendar_repository.get_member(connection, member_id)
        if member is None:
            raise _not_found("팀원을 찾을 수 없습니다.")

        updated = calendar_repository.update_member(connection, member_id, data)
        if updated is None:
            raise _not_found("팀원을 찾을 수 없습니다.")
        return updated


def delete_member(member_id: int) -> dict:
    with get_connection() as connection:
        member = calendar_repository.get_member(connection, member_id)
        if member is None:
            raise _not_found("팀원을 찾을 수 없습니다.")

        deleted = calendar_repository.deactivate_member(connection, member_id)
        if deleted is None:
            raise _not_found("팀원을 찾을 수 없습니다.")
        return deleted


def list_events(
    start_date: str | None = None,
    end_date: str | None = None,
    member_id: int | None = None,
) -> list[dict]:
    with get_connection() as connection:
        return calendar_repository.list_events(
            connection,
            _normalize_start_bound(start_date),
            _normalize_end_bound(end_date),
            member_id,
        )


def create_event(payload: CalendarEventCreate) -> dict:
    _validate_period(payload.starts_at, payload.ends_at)
    data = _strip_text_fields(payload.model_dump())

    with get_connection() as connection:
        _ensure_active_member(connection, data["member_id"])
        return calendar_repository.create_event(connection, data)


def update_event(event_id: int, payload: CalendarEventUpdate) -> dict:
    data = _strip_text_fields(payload.model_dump(exclude_unset=True))
    with get_connection() as connection:
        current = calendar_repository.get_event(connection, event_id)
        if current is None:
            raise _not_found("일정을 찾을 수 없습니다.")

        starts_at = data.get("starts_at") or datetime.fromisoformat(current["starts_at"])
        ends_at = data.get("ends_at") or datetime.fromisoformat(current["ends_at"])
        _validate_period(starts_at, ends_at)

        if "member_id" in data:
            _ensure_active_member(connection, data["member_id"])

        updated = calendar_repository.update_event(connection, event_id, data)
        if updated is None:
            raise _not_found("일정을 찾을 수 없습니다.")
        return updated


def delete_event(event_id: int) -> None:
    with get_connection() as connection:
        deleted = calendar_repository.delete_event(connection, event_id)
        if not deleted:
            raise _not_found("일정을 찾을 수 없습니다.")


def _ensure_active_member(connection, member_id: int) -> None:
    member = calendar_repository.get_member(connection, member_id)
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="존재하지 않는 팀원입니다.",
        )
    if not member["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="삭제된 팀원에게는 일정을 등록할 수 없습니다.",
        )


def _validate_period(starts_at: datetime, ends_at: datetime) -> None:
    if starts_at >= ends_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="일정 종료일시는 시작일시보다 이후여야 합니다.",
        )


def _strip_text_fields(data: dict) -> dict:
    return {
        key: value.strip() if isinstance(value, str) else value
        for key, value in data.items()
    }


def _not_found(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def _normalize_start_bound(value: str | None) -> str | None:
    if value is None:
        return None
    if len(value) == 10:
        return f"{value}T00:00:00"
    return value


def _normalize_end_bound(value: str | None) -> str | None:
    if value is None:
        return None
    if len(value) == 10:
        return f"{value}T23:59:59"
    return value
