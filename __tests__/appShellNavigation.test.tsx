import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider } from "@tanstack/react-router";
import { beforeEach, test } from "vitest";
import { router } from "../src/router";
import { initI18n } from "../src/i18n";

beforeEach(async () => {
  initI18n(true);
  await router.navigate({ to: "/" });
});

test("メニュー操作で SettingsPanel を開く", async () => {
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: "Menu" }));
  expect(await screen.findByText("設定")).toBeInTheDocument();
});

test("日付表示クリックでカレンダーへ遷移する", async () => {
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: "日付ビューへ" }));
  expect(await screen.findByText("カレンダー")).toBeInTheDocument();
});

test("Dashboard ボタンでダッシュボードへ遷移する", async () => {
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: "Dashboard" }));
  expect(await screen.findByText("週次ダッシュボード")).toBeInTheDocument();
});

test("sync status クリックで同期状態ダイアログを開く", async () => {
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: /Sync/ }));
  expect(await screen.findByText("同期状態")).toBeInTheDocument();
});

test("アバタークリックでアカウントメニューを開く", async () => {
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: "アカウント" }));
  expect(await screen.findByText("サインイン")).toBeInTheDocument();
  expect(screen.getByText("サインアウト")).toBeInTheDocument();
  expect(screen.getByText("閲覧専用リンク")).toBeInTheDocument();
});
