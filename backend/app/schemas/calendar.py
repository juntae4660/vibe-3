from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

EventType = Literal[
    "work",
    "vacation",
    "business_trip",
    "field_work",
    "training",
    "remote",
    "etc",
]


class TeamMemberBase(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    department: str | None = Field(default=None, max_length=80)
    position: str | None = Field(default=None, max_length=80)
    email: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=40)


class TeamMemberCreate(TeamMemberBase):
    pass


class TeamMemberUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    department: str | None = Field(default=None, max_length=80)
    position: str | None = Field(default=None, max_length=80)
    email: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=40)


class TeamMember(TeamMemberBase):
    model_config = ConfigDict(populate_by_name=True)

    id: int
    is_active: bool = Field(alias="isActive")
    created_at: str = Field(alias="createdAt")
    updated_at: str | None = Field(alias="updatedAt")


class CalendarEventBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    member_id: int = Field(alias="memberId")
    title: str = Field(min_length=1, max_length=120)
    event_type: EventType = Field(alias="eventType")
    starts_at: datetime = Field(alias="startsAt")
    ends_at: datetime = Field(alias="endsAt")
    location: str | None = Field(default=None, max_length=120)
    memo: str | None = Field(default=None, max_length=500)


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    member_id: int | None = Field(default=None, alias="memberId")
    title: str | None = Field(default=None, min_length=1, max_length=120)
    event_type: EventType | None = Field(default=None, alias="eventType")
    starts_at: datetime | None = Field(default=None, alias="startsAt")
    ends_at: datetime | None = Field(default=None, alias="endsAt")
    location: str | None = Field(default=None, max_length=120)
    memo: str | None = Field(default=None, max_length=500)


class CalendarEvent(CalendarEventBase):
    id: int
    member_name: str = Field(alias="memberName")
    created_at: str = Field(alias="createdAt")
    updated_at: str | None = Field(alias="updatedAt")
