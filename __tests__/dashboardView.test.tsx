import React from "react";
import { test } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Task } from "../src/domain/types";
import { DashboardView } from "../src/app/DashboardView";
import { computeSprintRange } from "../src/sprint/range";

test("DashboardView は集計セクションを表示する", () => {
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

  expect(screen.getByText("週次ダッシュボード")).toBeInTheDocument();
  expect(screen.getByText("教科別ステータス集計")).toBeInTheDocument();
  expect(screen.getByText("バーンダウン")).toBeInTheDocument();
});

test("DashboardView は教科別集計のステータス順とセクション順を守る", () => {
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

  const headings = screen.getAllByRole("heading", { level: 6 }).map((node) => node.textContent);
  expect(headings).toEqual(["教科別ステータス集計", "週次サマリ", "バーンダウン"]);

  const statusLine = screen.getByText(/Backlog 1/);
  expect(statusLine).toHaveTextContent(
    /Backlog 1 .* Today 1 .* InPro 1 .* OnHold 1 .* Done\s*1 .* WontFix 1/,
  );
});
