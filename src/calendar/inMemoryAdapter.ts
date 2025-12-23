import type { CalendarAdapter, CalendarEvent } from "./types";

export function createInMemoryCalendarAdapter(initial: CalendarEvent[] = []): CalendarAdapter {
  let events = [...initial];

  return {
    async listEvents() {
      return [...events];
    },
    async upsertEvent(event) {
      const exists = events.some((item) => item.id === event.id);
      events = exists ? events.map((item) => (item.id === event.id ? event : item)) : [...events, event];
      return event;
    },
    async deleteEvent(id) {
      events = events.filter((item) => item.id !== id);
    },
  };
}
