import React from "react";
import { test } from "vitest";
import { render, screen } from "@testing-library/react";
import { HelpPage } from "../src/app/HelpPage";

test("HelpPage は主要操作の説明を表示する", () => {
  render(<HelpPage />);
  expect(screen.getByText("ヘルプ")).toBeInTheDocument();
  expect(screen.getByText("タスク作成")).toBeInTheDocument();
  expect(screen.getByText("カレンダー利用")).toBeInTheDocument();
});
