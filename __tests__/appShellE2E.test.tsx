import React from "react";
import { test } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShell } from "../src/app/AppShell";
import { KanbanView } from "../src/app/KanbanView";
import { initI18n } from "../src/i18n";

test("AppShell はアプリタイトルとヘッダー要素を表示する", async () => {
  initI18n(true);
  render(
    <AppShell>
      <KanbanView />
    </AppShell>,
  );
  expect(screen.getByText("学習計画カンバン")).toBeInTheDocument();
  expect(screen.getByText("残り学習可能時間")).toBeInTheDocument();
});
