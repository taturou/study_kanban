import assert from "node:assert/strict";
import { test } from "node:test";
import { buildAppShellHtml } from "../src/main.js";

test("AppShell はカンバンの基本構造を含む HTML を生成する", () => {
  const html = buildAppShellHtml();
  assert.match(html, /data-testid="app-root"/);
  assert.match(html, /data-testid="kanban-board"/);
  assert.doesNotMatch(html, /data-testid="mcp-lab"/);
});

test("デモ用のタスクはカンバン内に含まれない", () => {
  const html = buildAppShellHtml();
  assert.doesNotMatch(html, /demo-1/);
  assert.doesNotMatch(html, /demo-2/);
  assert.doesNotMatch(html, /demo-3/);
  assert.doesNotMatch(html, /demo-4/);
});

test("スプリント期間の表示が含まれる", () => {
  const html = buildAppShellHtml(new Date("2025-01-15T10:00:00Z"));
  assert.match(html, /2025-01-13/);
  assert.match(html, /2025-01-19/);
});
