export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  status?: "confirmed" | "cancelled";
  source: "LPK" | "Google";
};

export type CalendarAdapter = {
  listEvents: () => Promise<CalendarEvent[]>;
  upsertEvent: (event: CalendarEvent) => Promise<CalendarEvent>;
  deleteEvent: (id: string) => Promise<void>;
};
