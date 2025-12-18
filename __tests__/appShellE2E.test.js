import assert from "node:assert/strict";
import { test } from "node:test";
import { buildAppShellHtml } from "../src/main.js";

test("AppShell は MCP ラボ用のデータ属性を含む HTML を生成する", () => {
  const html = buildAppShellHtml();
  assert.match(html, /data-testid="app-root"/);
  assert.match(html, /data-testid="kanban-board"/);
  assert.match(html, /data-testid="mcp-lab"/);
  assert.match(html, /data-testid="lab-backlog"/);
  assert.match(html, /data-testid="lab-today"/);
  assert.match(html, /data-testid="lab-done"/);
  assert.match(html, /data-testid="lab-create-button"/);
  assert.match(html, /data-testid="lab-status"/);
});
