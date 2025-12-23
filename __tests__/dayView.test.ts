import assert from "node:assert/strict";
import { test } from "vitest";
import type { Task } from "../src/domain/types";
import { buildDayViewLists } from "../src/calendar/dayView";
import { computeSprintRange } from "../src/sprint/range";

test("日付ビューは期日/追加/実施/超過の一覧を分離する", () => {
  const tasks: Task[] = [
    {
      id: "t1",
      title: "期日タスク",
      subjectId: "数学",
      status: "Today",
      priority: 1000,
      dueAt: "2025-12-17T00:00:00Z",
      createdAt: "2025-12-15T09:00:00Z",
      updatedAt: "2025-12-15T09:00:00Z",
    },
    {
      id: "t2",
      title: "追加タスク",
      subjectId: "数学",
      status: "Backlog",
      priority: 900,
      createdAt: "2025-12-17T08:00:00Z",
      updatedAt: "2025-12-17T08:00:00Z",
    },
    {
      id: "t3",
      title: "実施タスク",
      subjectId: "英語",
      status: "Done",
      priority: 800,
      actuals: [{ id: "a1", at: "2025-12-17", minutes: 25 }],
      createdAt: "2025-12-16T09:00:00Z",
      updatedAt: "2025-12-17T10:00:00Z",
    },
    {
      id: "t4",
      title: "前スプリント追加",
      subjectId: "英語",
      status: "Backlog",
      priority: 700,
      createdAt: "2025-12-14T09:00:00Z",
      updatedAt: "2025-12-14T09:00:00Z",
    },
    {
      id: "t5",
      title: "期限超過タスク",
      subjectId: "理科",
      status: "Today",
      priority: 600,
      dueAt: "2025-12-16T00:00:00Z",
      createdAt: "2025-12-15T09:00:00Z",
      updatedAt: "2025-12-16T09:00:00Z",
    },
  ];
  const sprintRange = computeSprintRange(new Date("2025-12-17T10:00:00Z"));

  const view = buildDayViewLists({
    tasks,
    date: new Date("2025-12-17T10:00:00Z"),
    sprintRange,
  });

  assert.equal(view.due.map((t) => t.id).includes("t1"), true);
  assert.equal(view.added.map((t) => t.id).includes("t2"), true);
  assert.equal(view.added.map((t) => t.id).includes("t4"), false);
  assert.equal(view.actual.map((t) => t.id).includes("t3"), true);
  assert.equal(view.overdue.map((t) => t.id).includes("t5"), true);
});
