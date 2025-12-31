import React from "react";
import { test } from "vitest";
import { render, screen } from "@testing-library/react";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "../src/router";
import { initI18n } from "../src/i18n";

test("AppShell はアプリタイトルとヘッダー要素を表示する", async () => {
  initI18n(true);
  render(<RouterProvider router={router} />);
  expect(await screen.findByRole("button", { name: "スプリント選択" })).toBeInTheDocument();
  expect(await screen.findByText("残り学習可能時間")).toBeInTheDocument();
});
