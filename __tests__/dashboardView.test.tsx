import React from "react";
import { test } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Task } from "../src/domain/types";
import { DashboardView } from "../src/app/DashboardView";
import { computeSprintRange } from "../src/sprint/range";

test("DashboardView は週次リソース調整を表示する", () => {
  const tasks: Task[] = [
    { id: "t1", title: "数学", subjectId: "数学", status: "Done", priority: 1000, estimateMinutes: 60 },
  ];
  render(
    <DashboardView
      tasks={tasks}
      subjects={["数学"]}
      sprintRange={computeSprintRange(new Date("2025-12-17T10:00:00Z"))}
    />,
  );

  expect(screen.getByText("週次リソース調整")).toBeInTheDocument();
});

test("DashboardView は週次リソース調整の主要要素を表示する", () => {
  const tasks: Task[] = [
    { id: "b1", title: "B", subjectId: "数学", status: "Backlog", priority: 1000, estimateMinutes: 30 },
    { id: "t1", title: "T", subjectId: "数学", status: "Today", priority: 900, estimateMinutes: 30 },
    { id: "i1", title: "I", subjectId: "数学", status: "InPro", priority: 800, estimateMinutes: 30 },
    { id: "h1", title: "H", subjectId: "数学", status: "OnHold", priority: 700, estimateMinutes: 30 },
    { id: "d1", title: "D", subjectId: "数学", status: "Done", priority: 600, estimateMinutes: 30 },
    { id: "w1", title: "W", subjectId: "数学", status: "WontFix", priority: 500, estimateMinutes: 30 },
  ];
  render(
    <DashboardView
      tasks={tasks}
      subjects={["数学"]}
      sprintRange={computeSprintRange(new Date("2025-12-17T10:00:00Z"))}
    />,
  );

  expect(screen.getByText("日別負荷状況")).toBeInTheDocument();
  expect(screen.getByText("▼ 1. 期限切れ・容量超過")).toBeInTheDocument();
});

test("DashboardView は週次リソース調整の要素を表示する", () => {
  const tasks: Task[] = [
    {
      id: "t1",
      title: "英語",
      subjectId: "英語",
      status: "Today",
      priority: 1000,
      estimateMinutes: 90,
      dueAt: "2025-11-11T00:00:00.000Z",
    },
    {
      id: "t2",
      title: "化学",
      subjectId: "化学",
      status: "OnHold",
      priority: 900,
      estimateMinutes: 300,
      dueAt: "2025-11-12T00:00:00.000Z",
    },
  ];
  render(
    <DashboardView
      tasks={tasks}
      subjects={["英語", "化学"]}
      sprintRange={computeSprintRange(new Date("2025-11-12T10:00:00Z"))}
      now={new Date("2025-11-14T10:00:00Z")}
    />,
  );

  expect(screen.getByText("週次リソース調整")).toBeInTheDocument();
  expect(screen.getByText("日別負荷状況")).toBeInTheDocument();
  expect(screen.getAllByText("推定").length).toBeGreaterThan(0);
  expect(screen.getByText("提案なし")).toBeInTheDocument();
  expect(screen.getByText("明日以降にやる へ")).toBeInTheDocument();
  expect(screen.getByText("※ 進行中 (勉強中) のタスクはここには表示されません。")).toBeInTheDocument();
});
