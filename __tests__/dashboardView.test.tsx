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
