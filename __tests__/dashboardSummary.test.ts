import assert from "node:assert/strict";
import { test } from "vitest";
import type { Task } from "../src/domain/types";
import { buildDashboardSummary } from "../src/dashboard/summary";
import { computeSprintRange } from "../src/sprint/range";

test("Dashboard 集計は教科×ステータスと週次サマリを返す", () => {
  const tasks: Task[] = [
    {
      id: "t1",
      title: "数学の復習",
      subjectId: "数学",
      status: "Done",
      priority: 1000,
      estimateMinutes: 60,
      actuals: [{ id: "a1", at: "2025-12-16", minutes: 30 }],
      createdAt: "2025-12-15T08:00:00Z",
      updatedAt: "2025-12-16T10:00:00Z",
    },
    {
      id: "t2",
      title: "数学の演習",
      subjectId: "数学",
      status: "Today",
      priority: 900,
      estimateMinutes: 30,
      createdAt: "2025-12-15T08:30:00Z",
      updatedAt: "2025-12-15T08:30:00Z",
    },
    {
      id: "t3",
      title: "英語の単語",
      subjectId: "英語",
      status: "Done",
      priority: 800,
      estimateMinutes: 45,
      actuals: [{ id: "a2", at: "2025-12-20", minutes: 20 }],
      createdAt: "2025-12-16T09:00:00Z",
      updatedAt: "2025-12-20T12:00:00Z",
    },
    {
      id: "t4",
      title: "英語の長文",
      subjectId: "英語",
      status: "Backlog",
      priority: 700,
      estimateMinutes: 90,
      createdAt: "2025-12-15T10:00:00Z",
      updatedAt: "2025-12-15T10:00:00Z",
    },
  ];
  const sprintRange = computeSprintRange(new Date("2025-12-17T10:00:00Z"));

  const summary = buildDashboardSummary({
    tasks,
    subjects: ["数学", "英語"],
    sprintRange,
  });

  assert.equal(summary.statusCounts["数学"].Done, 1);
  assert.equal(summary.statusCounts["数学"].Today, 1);
  assert.equal(summary.statusCounts["英語"].Backlog, 1);
  assert.equal(summary.statusCounts["英語"].Done, 1);
  assert.equal(summary.doneBySubject["数学"], 1);
  assert.equal(summary.doneBySubject["英語"], 1);
  assert.equal(summary.minutesBySubject["数学"], 30);
  assert.equal(summary.minutesBySubject["英語"], 20);
});

test("バーンダウンはスプリント期間の残件/見積を日次で返す", () => {
  const tasks: Task[] = [
    {
      id: "t1",
      title: "数学の復習",
      subjectId: "数学",
      status: "Done",
      priority: 1000,
      estimateMinutes: 60,
      createdAt: "2025-12-15T08:00:00Z",
      updatedAt: "2025-12-16T10:00:00Z",
    },
    {
      id: "t2",
      title: "数学の演習",
      subjectId: "数学",
      status: "Today",
      priority: 900,
      estimateMinutes: 30,
      createdAt: "2025-12-15T08:30:00Z",
      updatedAt: "2025-12-15T08:30:00Z",
    },
    {
      id: "t3",
      title: "英語の単語",
      subjectId: "英語",
      status: "Done",
      priority: 800,
      estimateMinutes: 45,
      createdAt: "2025-12-16T09:00:00Z",
      updatedAt: "2025-12-20T12:00:00Z",
    },
    {
      id: "t4",
      title: "英語の長文",
      subjectId: "英語",
      status: "Backlog",
      priority: 700,
      estimateMinutes: 90,
      createdAt: "2025-12-15T10:00:00Z",
      updatedAt: "2025-12-15T10:00:00Z",
    },
  ];
  const sprintRange = computeSprintRange(new Date("2025-12-17T10:00:00Z"));

  const summary = buildDashboardSummary({
    tasks,
    subjects: ["数学", "英語"],
    sprintRange,
  });

  const series = summary.burndown;
  assert.equal(series[0].remainingCount, 4);
  assert.equal(series[0].remainingMinutes, 225);
  assert.equal(series[1].remainingCount, 3);
  assert.equal(series[1].remainingMinutes, 165);
  assert.equal(series[5].remainingCount, 2);
  assert.equal(series[5].remainingMinutes, 120);
  assert.equal(series[6].remainingCount, 2);
  assert.equal(series[6].remainingMinutes, 120);
});
