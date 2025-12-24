import React from "react";
import { test } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarView } from "../src/app/CalendarView";

test("CalendarView は週次ヘッダーと日次パネルを表示する", () => {
  window.localStorage.clear();
  render(<CalendarView />);
  expect(screen.getByText(/合計可能:/)).toBeInTheDocument();
  expect(screen.getByText(/日付:/)).toBeInTheDocument();
});

test("CalendarView は予定の空状態を表示する", async () => {
  window.localStorage.clear();
  render(<CalendarView />);

  expect(await screen.findByText("予定はありません")).toBeInTheDocument();
});

test("CalendarView は選択日を更新し学習可能時間を上書きできる", async () => {
  window.localStorage.setItem("lpk.currentSprintId", "2025-12-22");
  const user = userEvent.setup();
  render(<CalendarView />);

  expect(screen.getByText(/日付: 12\/22/)).toBeInTheDocument();

  await user.click(screen.getByText("12/24"));
  expect(screen.getByText(/日付: 12\/24/)).toBeInTheDocument();

  const availabilityInput = screen.getByLabelText("月");
  fireEvent.change(availabilityInput, { target: { value: "1.5" } });
  expect(availabilityInput).toHaveValue(1.5);
});

test("CalendarView はオフライン時の予定追加エラーを表示する", async () => {
  window.localStorage.clear();
  const user = userEvent.setup();
  const original = Object.getOwnPropertyDescriptor(navigator, "onLine");
  Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false });

  render(<CalendarView />);

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
