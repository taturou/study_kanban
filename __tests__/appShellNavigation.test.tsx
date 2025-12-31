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

  await user.click(screen.getByRole("button", { name: "メニュー" }));
  expect(await screen.findByText("設定")).toBeInTheDocument();
});

test("スプリント表示クリックで週選択ダイアログを開く", async () => {
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: "スプリント選択" }));
  expect(await screen.findByText("週を選択")).toBeInTheDocument();
});

test("ダッシュボード ボタンでダッシュボードへ遷移する", async () => {
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: "ダッシュボード" }));
  expect(await screen.findByText("週次リソース調整")).toBeInTheDocument();
});

test("sync status クリックで同期状態ダイアログを開く", async () => {
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: "同期状態" }));
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
