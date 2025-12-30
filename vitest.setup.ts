import "@testing-library/jest-dom";
import React from "react";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

vi.mock("@mui/x-date-pickers", () => ({
  DateCalendar: ({ onChange }: { onChange?: (value: Date | null) => void }) =>
    React.createElement(
      "button",
      { type: "button", onClick: () => onChange?.(new Date("2025-12-24T00:00:00.000Z")) },
      "DateCalendarMock",
    ),
  LocalizationProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
}));

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = ResizeObserverMock;
}

afterEach(() => {
  cleanup();
});
