export type EventType =
  | "work"
  | "vacation"
  | "business_trip"
  | "field_work"
  | "training"
  | "remote"
  | "etc";

export type TeamMember = {
  id: number;
  name: string;
  department?: string | null;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
};

export type TeamMemberPayload = {
  name: string;
  department?: string | null;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type CalendarEvent = {
  id: number;
  memberId: number;
  memberName: string;
  title: string;
  eventType: EventType;
  startsAt: string;
  endsAt: string;
  location?: string | null;
  memo?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type CalendarEventPayload = {
  memberId: number;
  title: string;
  eventType: EventType;
  startsAt: string;
  endsAt: string;
  location?: string | null;
  memo?: string | null;
};
