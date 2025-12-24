import React from "react";
import { test } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarView } from "../src/app/CalendarView";

test("CalendarView はカレンダーと日付ビューを表示する", () => {
  window.localStorage.clear();
  render(<CalendarView />);
  expect(screen.getByText("カレンダー")).toBeInTheDocument();
  expect(screen.getByText("日付ビュー")).toBeInTheDocument();
});

test("CalendarView は日付ビューの空状態と予定の空状態を表示する", async () => {
  window.localStorage.clear();
  render(<CalendarView />);

  const emptyStates = screen.getAllByText("該当なし");
  expect(emptyStates).toHaveLength(4);
  expect(await screen.findByText("予定はありません")).toBeInTheDocument();
});

test("CalendarView は選択日を更新し学習可能時間を上書きできる", async () => {
  window.localStorage.setItem("lpk.currentSprintId", "2025-12-22");
  const user = userEvent.setup();
  render(<CalendarView />);

  expect(screen.getByText("選択日: 2025-12-22")).toBeInTheDocument();

  const dayCell = screen.getByRole("gridcell", { name: "15" });
  await user.click(dayCell);
  expect(screen.getByText(/選択日:/)).not.toHaveTextContent("2025-12-22");

  const availabilityInput = screen.getByLabelText("学習可能時間(分)");
  fireEvent.change(availabilityInput, { target: { value: "90" } });
  expect(availabilityInput).toHaveValue(90);
});

test("CalendarView はオフライン時の予定追加エラーを表示する", async () => {
  window.localStorage.clear();
  const user = userEvent.setup();
  const original = Object.getOwnPropertyDescriptor(navigator, "onLine");
  Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false });

  render(<CalendarView />);

  const titleInput = screen.getByLabelText("予定タイトル");
  await user.type(titleInput, "塾の予定");
  await user.click(screen.getByRole("button", { name: "予定を追加" }));

  expect(
    await screen.findByText("オフラインのため予定を追加できません。オンライン時に再試行してください。"),
  ).toBeInTheDocument();

  if (original) {
    Object.defineProperty(navigator, "onLine", original);
  }
});
