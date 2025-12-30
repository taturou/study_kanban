import React from "react";
import { test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlanView } from "../src/app/PlanView";

const mockKanbanState = {
  sprintTasks: [],
  setCurrentSprintDate: vi.fn(),
  currentSprintDate: null as Date | null,
};

vi.mock("../src/store/kanbanStore", () => ({
  useKanbanStore: (selector: (state: typeof mockKanbanState) => unknown) => selector(mockKanbanState),
}));

test("PlanView は週次サマリと日次パネルを表示する", () => {
  window.localStorage.clear();
  render(<PlanView />);
  expect(screen.getByText(/合計可能:/)).toBeInTheDocument();
  expect(screen.getByText(/日付:/)).toBeInTheDocument();
});

test("PlanView は予定の空状態を表示する", async () => {
  window.localStorage.clear();
  render(<PlanView />);

  expect(await screen.findByText("予定はありません")).toBeInTheDocument();
});

test("PlanView は選択日を更新し学習可能時間を上書きできる", async () => {
  window.localStorage.setItem("lpk.currentSprintId", "2025-12-22");
  const user = userEvent.setup();
  render(<PlanView />);

  expect(screen.getByText(/日付: 12\/22/)).toBeInTheDocument();

  fireEvent.click(screen.getByText("12/24"));
  expect(await screen.findByText(/日付: 12\/24/)).toBeInTheDocument();

  const availabilitySelect = screen.getByRole("combobox", { name: "月" });
  await user.click(availabilitySelect);
  await user.click(screen.getByRole("option", { name: "1.5h" }));
  expect(availabilitySelect).toHaveTextContent("1.5h");
});

test("PlanView はオフライン時の予定追加エラーを表示する", async () => {
  window.localStorage.clear();
  const user = userEvent.setup();
  const original = Object.getOwnPropertyDescriptor(navigator, "onLine");
  Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false });

  render(<PlanView />);

  const titleInput = screen.getByLabelText("予定タイトル");
  await user.type(titleInput, "塾の予定");
  await user.click(screen.getByRole("button", { name: "追加" }));

  expect(
    await screen.findByText("オフラインのため予定を追加できません。オンライン時に再試行してください。"),
  ).toBeInTheDocument();

  if (original) {
    Object.defineProperty(navigator, "onLine", original);
  }
});
