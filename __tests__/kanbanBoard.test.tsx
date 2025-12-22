import React from "react";
import { test } from "vitest";
import { render, screen } from "@testing-library/react";
import { KanbanBoard } from "../src/app/KanbanBoard";
import { useKanbanStore } from "../src/store/kanbanStore";
import { STATUS_ORDER } from "../src/status/policy";

test("固定ステータス×教科のグリッドを描画する", () => {
  useKanbanStore.setState({
    subjects: ["English", "Math"],
    tasks: [],
  });

  render(<KanbanBoard />);

  STATUS_ORDER.forEach((status) => {
    expect(screen.getByText(status)).toBeInTheDocument();
  });
  expect(screen.getByText("English")).toBeInTheDocument();
  expect(screen.getByText("Math")).toBeInTheDocument();
});
