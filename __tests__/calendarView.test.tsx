import React from "react";
import { test } from "vitest";
import { render, screen } from "@testing-library/react";
import { CalendarView } from "../src/app/CalendarView";

test("CalendarView はカレンダーと日付ビューを表示する", () => {
  render(<CalendarView />);
  expect(screen.getByText("カレンダー")).toBeInTheDocument();
  expect(screen.getByText("日付ビュー")).toBeInTheDocument();
});
