import assert from "node:assert/strict";
import { test } from "vitest";
import { buildCalendarGrid, getWeekStart } from "../src/calendar/utils";

test("カレンダーは月曜始まりの 6 週グリッドを返す", () => {
  const grid = buildCalendarGrid(new Date("2025-08-15T00:00:00Z"));
  assert.equal(grid.length, 6);
  assert.equal(grid[0].length, 7);
  assert.equal(grid.flat().length, 42);
  assert.equal(grid[0][0].toISOString().slice(0, 10), "2025-07-28");
});

test("日付から週の開始（月曜）を返す", () => {
  const start = getWeekStart(new Date("2025-08-13T10:00:00Z"));
  assert.equal(start.toISOString().slice(0, 10), "2025-08-11");
});
