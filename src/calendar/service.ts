import type { CalendarAdapter, CalendarEvent } from "./types";

type CalendarServiceOptions = {
  adapter: CalendarAdapter;
  isOnline?: () => boolean;
};

type UpsertResult = { ok: true; event: CalendarEvent } | { ok: false; reason: "offline" };
type OperationResult = { ok: true } | { ok: false; reason: "offline" };

export function createCalendarService({ adapter, isOnline = () => navigator.onLine }: CalendarServiceOptions) {
  return {
    async listEvents() {
      return adapter.listEvents();
    },
    async upsertEvent(event: CalendarEvent): Promise<UpsertResult> {
      if (!isOnline()) {
        return { ok: false, reason: "offline" };
      }
      const saved = await adapter.upsertEvent(event);
      return { ok: true, event: saved };
    },
    async deleteEvent(id: string): Promise<OperationResult> {
      if (!isOnline()) {
        return { ok: false, reason: "offline" };
      }
      await adapter.deleteEvent(id);
      return { ok: true };
    },
  };
}
