from fastapi import APIRouter, Response, status

from app.schemas.calendar import (
    CalendarEvent,
    CalendarEventCreate,
    CalendarEventUpdate,
    TeamMember,
    TeamMemberCreate,
    TeamMemberUpdate,
)
from app.services import calendar_service

router = APIRouter(tags=["calendar"])


@router.get("/members", response_model=list[TeamMember])
def list_members() -> list[dict]:
    return calendar_service.list_members()


@router.post(
    "/members",
    response_model=TeamMember,
    status_code=status.HTTP_201_CREATED,
)
def create_member(payload: TeamMemberCreate) -> dict:
    return calendar_service.create_member(payload)


@router.put("/members/{member_id}", response_model=TeamMember)
def update_member(member_id: int, payload: TeamMemberUpdate) -> dict:
    return calendar_service.update_member(member_id, payload)


@router.delete("/members/{member_id}", response_model=TeamMember)
def delete_member(member_id: int) -> dict:
    return calendar_service.delete_member(member_id)


@router.get("/events", response_model=list[CalendarEvent])
def list_events(
    start_date: str | None = None,
    end_date: str | None = None,
    member_id: int | None = None,
) -> list[dict]:
    return calendar_service.list_events(start_date, end_date, member_id)


@router.post(
    "/events",
    response_model=CalendarEvent,
    status_code=status.HTTP_201_CREATED,
)
def create_event(payload: CalendarEventCreate) -> dict:
    return calendar_service.create_event(payload)


@router.put("/events/{event_id}", response_model=CalendarEvent)
def update_event(event_id: int, payload: CalendarEventUpdate) -> dict:
    return calendar_service.update_event(event_id, payload)


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: int) -> Response:
    calendar_service.delete_event(event_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
