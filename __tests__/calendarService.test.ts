import assert from "node:assert/strict";
import { test } from "vitest";
import { createCalendarService } from "../src/calendar/service";
import { createInMemoryCalendarAdapter } from "../src/calendar/inMemoryAdapter";

test("カレンダー追加はオフライン時に拒否する", async () => {
  const adapter = createInMemoryCalendarAdapter();
  const service = createCalendarService({
    adapter,
    isOnline: () => false,
  });

  const result = await service.upsertEvent({
    id: "e1",
    title: "英語",
    start: "2025-12-17T10:00:00Z",
    end: "2025-12-17T11:00:00Z",
    source: "LPK",
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "offline");
});

test("カレンダー追加はオンライン時に保存される", async () => {
  const adapter = createInMemoryCalendarAdapter();
  const service = createCalendarService({
    adapter,
    isOnline: () => true,
  });

  const result = await service.upsertEvent({
    id: "e1",
    title: "英語",
    start: "2025-12-17T10:00:00Z",
    end: "2025-12-17T11:00:00Z",
    source: "LPK",
  });

  assert.equal(result.ok, true);
  const list = await service.listEvents();
  assert.equal(list.length, 1);
  assert.equal(list[0].title, "英語");
});
