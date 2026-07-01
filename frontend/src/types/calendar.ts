export type CalendarEvent = {
  id: number;
  title: string;
  eventType: "vacation" | "work" | "business_trip" | "field_work" | "training" | "etc";
  startsAt: string;
  endsAt: string;
};
