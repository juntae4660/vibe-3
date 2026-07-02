import type {
  CalendarEvent,
  CalendarEventPayload,
  TeamMember,
  TeamMemberPayload,
} from "../types/calendar";
import { apiUrl } from "./config";

const CALENDAR_API = "/api/calendar";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(`${CALENDAR_API}${path}`), {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const detail = await readError(response);
    throw new Error(detail || `calendar API request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function listTeamMembers() {
  return request<TeamMember[]>("/members");
}

export function createTeamMember(payload: TeamMemberPayload) {
  return request<TeamMember>("/members", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTeamMember(memberId: number, payload: TeamMemberPayload) {
  return request<TeamMember>(`/members/${memberId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteTeamMember(memberId: number) {
  return request<TeamMember>(`/members/${memberId}`, {
    method: "DELETE",
  });
}

export function listCalendarEvents(params: {
  startDate?: string;
  endDate?: string;
  memberId?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.set("start_date", params.startDate);
  if (params.endDate) searchParams.set("end_date", params.endDate);
  if (params.memberId) searchParams.set("member_id", String(params.memberId));

  const query = searchParams.toString();
  return request<CalendarEvent[]>(`/events${query ? `?${query}` : ""}`);
}

export function createCalendarEvent(payload: CalendarEventPayload) {
  return request<CalendarEvent>("/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCalendarEvent(eventId: number, payload: CalendarEventPayload) {
  return request<CalendarEvent>(`/events/${eventId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteCalendarEvent(eventId: number) {
  return request<void>(`/events/${eventId}`, {
    method: "DELETE",
  });
}

async function readError(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as { detail?: string };
    return body.detail ?? null;
  } catch {
    return null;
  }
}
