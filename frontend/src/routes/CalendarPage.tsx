import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createCalendarEvent,
  createTeamMember,
  deleteCalendarEvent,
  deleteTeamMember,
  listCalendarEvents,
  listTeamMembers,
  updateCalendarEvent,
  updateTeamMember,
} from "../api/calendarApi";
import type {
  CalendarEvent,
  CalendarEventPayload,
  EventType,
  TeamMember,
  TeamMemberPayload,
} from "../types/calendar";

type ViewMode = "week" | "month";

const eventTypeLabels: Record<EventType, string> = {
  work: "근무",
  vacation: "휴가",
  business_trip: "출장",
  field_work: "외근",
  training: "교육",
  remote: "재택",
  etc: "기타",
};

const emptyMemberForm: TeamMemberPayload = {
  name: "",
  department: "",
  position: "",
  email: "",
  phone: "",
};

const emptyEventForm: CalendarEventPayload = {
  memberId: 0,
  title: "",
  eventType: "work",
  startsAt: toDateTimeInput(new Date()),
  endsAt: toDateTimeInput(addHours(new Date(), 1)),
  location: "",
  memo: "",
};

export function CalendarPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [baseDate, setBaseDate] = useState(() => new Date());
  const [selectedMemberId, setSelectedMemberId] = useState<number | "all">("all");
  const [memberForm, setMemberForm] = useState<TeamMemberPayload>(emptyMemberForm);
  const [eventForm, setEventForm] = useState<CalendarEventPayload>(emptyEventForm);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeMembers = members.filter((member) => member.isActive);
  const range = useMemo(() => getRange(baseDate, viewMode), [baseDate, viewMode]);
  const visibleEvents = events.filter((calendarEvent) => {
    if (selectedMemberId === "all") return true;
    return calendarEvent.memberId === selectedMemberId;
  });

  useEffect(() => {
    void loadMembers();
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [range.startKey, range.endKey, selectedMemberId]);

  useEffect(() => {
    if (eventForm.memberId === 0 && activeMembers[0]) {
      setEventForm((current) => ({ ...current, memberId: activeMembers[0].id }));
    }
  }, [activeMembers, eventForm.memberId]);

  async function loadMembers() {
    try {
      setError(null);
      setMembers(await listTeamMembers());
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    }
  }

  async function loadEvents() {
    try {
      setIsLoading(true);
      setError(null);
      setEvents(
        await listCalendarEvents({
          startDate: range.startKey,
          endDate: range.endKey,
          memberId: selectedMemberId === "all" ? undefined : selectedMemberId,
        }),
      );
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMemberSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setError(null);
      if (editingMemberId) {
        await updateTeamMember(editingMemberId, normalizeMemberPayload(memberForm));
      } else {
        await createTeamMember(normalizeMemberPayload(memberForm));
      }
      setMemberForm(emptyMemberForm);
      setEditingMemberId(null);
      await loadMembers();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    }
  }

  async function handleEventSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!eventForm.memberId) {
      setError("일정을 등록할 팀원을 선택하세요.");
      return;
    }

    try {
      setError(null);
      const payload = normalizeEventPayload(eventForm);
      if (editingEventId) {
        await updateCalendarEvent(editingEventId, payload);
      } else {
        await createCalendarEvent(payload);
      }
      resetEventForm();
      await loadEvents();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    }
  }

  function startEditMember(member: TeamMember) {
    setEditingMemberId(member.id);
    setMemberForm({
      name: member.name,
      department: member.department ?? "",
      position: member.position ?? "",
      email: member.email ?? "",
      phone: member.phone ?? "",
    });
  }

  async function handleDeleteMember(memberId: number) {
    try {
      setError(null);
      await deleteTeamMember(memberId);
      if (selectedMemberId === memberId) {
        setSelectedMemberId("all");
      }
      await loadMembers();
      await loadEvents();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    }
  }

  function startEditEvent(calendarEvent: CalendarEvent) {
    setEditingEventId(calendarEvent.id);
    setEventForm({
      memberId: calendarEvent.memberId,
      title: calendarEvent.title,
      eventType: calendarEvent.eventType,
      startsAt: toDateTimeInput(new Date(calendarEvent.startsAt)),
      endsAt: toDateTimeInput(new Date(calendarEvent.endsAt)),
      location: calendarEvent.location ?? "",
      memo: calendarEvent.memo ?? "",
    });
  }

  async function handleDeleteEvent(eventId: number) {
    try {
      setError(null);
      await deleteCalendarEvent(eventId);
      await loadEvents();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    }
  }

  function resetEventForm() {
    setEditingEventId(null);
    setEventForm({
      ...emptyEventForm,
      memberId: activeMembers[0]?.id ?? 0,
      startsAt: toDateTimeInput(new Date()),
      endsAt: toDateTimeInput(addHours(new Date(), 1)),
    });
  }

  return (
    <div className="calendar-workspace">
      <section className="calendar-toolbar">
        <div>
          <p className="eyebrow">Team Schedule</p>
          <h3>{formatRangeTitle(range.start, range.end, viewMode)}</h3>
        </div>
        <div className="toolbar-actions">
          <button type="button" onClick={() => setBaseDate(shiftDate(baseDate, viewMode, -1))}>
            이전
          </button>
          <button type="button" onClick={() => setBaseDate(new Date())}>
            오늘
          </button>
          <button type="button" onClick={() => setBaseDate(shiftDate(baseDate, viewMode, 1))}>
            다음
          </button>
          <button
            className={viewMode === "week" ? "active" : ""}
            type="button"
            onClick={() => setViewMode("week")}
          >
            주간
          </button>
          <button
            className={viewMode === "month" ? "active" : ""}
            type="button"
            onClick={() => setViewMode("month")}
          >
            월간
          </button>
        </div>
      </section>

      {error ? <p className="error-banner">{error}</p> : null}

      <div className="calendar-layout">
        <aside className="calendar-side-panel">
          <section className="schedule-card">
            <h4>팀원 관리</h4>
            <form className="stack-form" onSubmit={handleMemberSubmit}>
              <input
                required
                placeholder="이름"
                value={memberForm.name}
                onChange={(event) => setMemberForm({ ...memberForm, name: event.target.value })}
              />
              <input
                placeholder="부서"
                value={memberForm.department ?? ""}
                onChange={(event) =>
                  setMemberForm({ ...memberForm, department: event.target.value })
                }
              />
              <input
                placeholder="직위"
                value={memberForm.position ?? ""}
                onChange={(event) =>
                  setMemberForm({ ...memberForm, position: event.target.value })
                }
              />
              <input
                placeholder="이메일"
                value={memberForm.email ?? ""}
                onChange={(event) => setMemberForm({ ...memberForm, email: event.target.value })}
              />
              <input
                placeholder="연락처"
                value={memberForm.phone ?? ""}
                onChange={(event) => setMemberForm({ ...memberForm, phone: event.target.value })}
              />
              <div className="form-actions">
                <button type="submit">{editingMemberId ? "팀원 수정" : "팀원 등록"}</button>
                {editingMemberId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMemberId(null);
                      setMemberForm(emptyMemberForm);
                    }}
                  >
                    취소
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="schedule-card">
            <div className="section-heading">
              <h4>팀원 목록</h4>
              <select
                value={selectedMemberId}
                onChange={(event) =>
                  setSelectedMemberId(
                    event.target.value === "all" ? "all" : Number(event.target.value),
                  )
                }
              >
                <option value="all">전체 일정</option>
                {activeMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="member-list">
              {members.map((member) => (
                <article className={!member.isActive ? "member-card inactive" : "member-card"} key={member.id}>
                  <strong>{member.name}</strong>
                  <span>
                    {[member.department, member.position].filter(Boolean).join(" / ") || "소속 미입력"}
                  </span>
                  <div className="mini-actions">
                    <button type="button" onClick={() => startEditMember(member)}>
                      수정
                    </button>
                    {member.isActive ? (
                      <button type="button" onClick={() => handleDeleteMember(member.id)}>
                        삭제
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
              {members.length === 0 ? <p className="empty-state">등록된 팀원이 없습니다.</p> : null}
            </div>
          </section>
        </aside>

        <section className="calendar-main-panel">
          <section className="schedule-card">
            <h4>{editingEventId ? "일정 수정" : "일정 등록"}</h4>
            <form className="event-form" onSubmit={handleEventSubmit}>
              <select
                required
                value={eventForm.memberId}
                onChange={(event) =>
                  setEventForm({ ...eventForm, memberId: Number(event.target.value) })
                }
              >
                <option value={0}>팀원 선택</option>
                {activeMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              <input
                required
                placeholder="일정 제목"
                value={eventForm.title}
                onChange={(event) => setEventForm({ ...eventForm, title: event.target.value })}
              />
              <select
                value={eventForm.eventType}
                onChange={(event) =>
                  setEventForm({ ...eventForm, eventType: event.target.value as EventType })
                }
              >
                {Object.entries(eventTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                required
                type="datetime-local"
                value={eventForm.startsAt}
                onChange={(event) => setEventForm({ ...eventForm, startsAt: event.target.value })}
              />
              <input
                required
                type="datetime-local"
                value={eventForm.endsAt}
                onChange={(event) => setEventForm({ ...eventForm, endsAt: event.target.value })}
              />
              <input
                placeholder="장소"
                value={eventForm.location ?? ""}
                onChange={(event) => setEventForm({ ...eventForm, location: event.target.value })}
              />
              <input
                placeholder="메모"
                value={eventForm.memo ?? ""}
                onChange={(event) => setEventForm({ ...eventForm, memo: event.target.value })}
              />
              <div className="form-actions">
                <button type="submit">{editingEventId ? "일정 수정" : "일정 등록"}</button>
                {editingEventId ? (
                  <button type="button" onClick={resetEventForm}>
                    취소
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="schedule-card schedule-view">
            <div className="section-heading">
              <h4>{viewMode === "week" ? "주간 일정표" : "월간 캘린더"}</h4>
              <span>{isLoading ? "불러오는 중..." : `${visibleEvents.length}건`}</span>
            </div>
            {viewMode === "week" ? (
              <WeeklyTable
                events={visibleEvents}
                onDelete={handleDeleteEvent}
                onEdit={startEditEvent}
              />
            ) : (
              <MonthlyCalendar
                baseDate={baseDate}
                events={visibleEvents}
                onDelete={handleDeleteEvent}
                onEdit={startEditEvent}
              />
            )}
          </section>
        </section>
      </div>
    </div>
  );
}

function WeeklyTable({
  events,
  onEdit,
  onDelete,
}: {
  events: CalendarEvent[];
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: number) => void;
}) {
  if (events.length === 0) {
    return <p className="empty-state">해당 기간의 일정이 없습니다.</p>;
  }

  return (
    <div className="table-scroll">
      <table className="weekly-table">
        <thead>
          <tr>
            <th>날짜</th>
            <th>팀원</th>
            <th>유형</th>
            <th>시간</th>
            <th>제목</th>
            <th>장소</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{formatDate(event.startsAt)}</td>
              <td>{event.memberName}</td>
              <td>
                <span className={`event-chip ${event.eventType}`}>
                  {eventTypeLabels[event.eventType]}
                </span>
              </td>
              <td>
                {formatTime(event.startsAt)} - {formatTime(event.endsAt)}
              </td>
              <td>{event.title}</td>
              <td>{event.location || "-"}</td>
              <td>
                <div className="mini-actions">
                  <button type="button" onClick={() => onEdit(event)}>
                    수정
                  </button>
                  <button type="button" onClick={() => onDelete(event.id)}>
                    삭제
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MonthlyCalendar({
  baseDate,
  events,
  onEdit,
  onDelete,
}: {
  baseDate: Date;
  events: CalendarEvent[];
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: number) => void;
}) {
  const days = getMonthGrid(baseDate);

  return (
    <div className="month-grid">
      {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
        <strong className="month-weekday" key={day}>
          {day}
        </strong>
      ))}
      {days.map((day) => {
        const dayKey = toDateKey(day);
        const dayEvents = events.filter((event) => toDateKey(new Date(event.startsAt)) === dayKey);
        const isOutside = day.getMonth() !== baseDate.getMonth();

        return (
          <article className={isOutside ? "month-day outside" : "month-day"} key={dayKey}>
            <span>{day.getDate()}</span>
            <div className="month-events">
              {dayEvents.map((event) => (
                <button className="month-event" key={event.id} type="button" onClick={() => onEdit(event)}>
                  <b>{event.memberName}</b>
                  {event.title}
                  <small>
                    {formatTime(event.startsAt)}
                    <span
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        onDelete(event.id);
                      }}
                    >
                      삭제
                    </span>
                  </small>
                </button>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function getRange(baseDate: Date, viewMode: ViewMode) {
  if (viewMode === "week") {
    const start = startOfWeek(baseDate);
    const end = addDays(start, 6);
    return { start, end, startKey: toDateKey(start), endKey: toDateKey(end) };
  }

  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  return { start, end, startKey: toDateKey(start), endKey: toDateKey(end) };
}

function getMonthGrid(baseDate: Date) {
  const first = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function startOfWeek(date: Date) {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

function shiftDate(date: Date, viewMode: ViewMode, amount: number) {
  const next = new Date(date);
  if (viewMode === "week") {
    next.setDate(date.getDate() + amount * 7);
  } else {
    next.setMonth(date.getMonth() + amount);
  }
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

function addHours(date: Date, hours: number) {
  const next = new Date(date);
  next.setHours(date.getHours() + hours);
  return next;
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toDateTimeInput(date: Date) {
  return `${toDateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRangeTitle(start: Date, end: Date, viewMode: ViewMode) {
  if (viewMode === "month") {
    return `${start.getFullYear()}년 ${start.getMonth() + 1}월`;
  }
  return `${toDateKey(start)} - ${toDateKey(end)}`;
}

function normalizeMemberPayload(payload: TeamMemberPayload): TeamMemberPayload {
  return {
    name: payload.name.trim(),
    department: normalizeOptional(payload.department),
    position: normalizeOptional(payload.position),
    email: normalizeOptional(payload.email),
    phone: normalizeOptional(payload.phone),
  };
}

function normalizeEventPayload(payload: CalendarEventPayload): CalendarEventPayload {
  return {
    ...payload,
    title: payload.title.trim(),
    location: normalizeOptional(payload.location),
    memo: normalizeOptional(payload.memo),
  };
}

function normalizeOptional(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "요청 처리 중 오류가 발생했습니다.";
}
