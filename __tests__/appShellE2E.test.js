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
