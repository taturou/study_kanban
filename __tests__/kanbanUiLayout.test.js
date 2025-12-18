import assert from "node:assert/strict";
import { test } from "node:test";
import { renderAppShell } from "../src/main.js";

function createMockDocument() {
  const container = { innerHTML: "" };
  const appended = [];
  return {
    container,
    appended,
    document: {
      querySelector: (sel) => (sel === "#app" ? container : null),
      createElement: (tag) => ({ tagName: tag, rel: "", href: "", setAttribute() {}, textContent: "", innerHTML: "", id: "" }),
      head: { appendChild: (node) => appended.push(node) },
    },
  };
}

test("AppShell に AppBar と KanbanHeader があり、KanbanBoard とスクロール設定が反映される", () => {
  const { container, appended, document } = createMockDocument();

  renderAppShell(document);

  assert.match(container.innerHTML, /data-testid="app-bar"/);
  assert.match(container.innerHTML, /data-testid="kanban-header"/);
  assert.match(container.innerHTML, /data-testid="pomodoro-button"/);
  assert.match(container.innerHTML, /kanban-board/);
  assert.match(container.innerHTML, /data-scroll-horizontal="(true|false)"/);
  assert.match(container.innerHTML, /data-pinned-subject-column="false"/);
  assert.ok(appended.length > 0);
});

test("スタイルシートにレイアウト用の CSS 変数とピン留め/スクロールの見た目設定が含まれる", () => {
  const { container, appended, document } = createMockDocument();

  renderAppShell(document);

  const styleContent = appended.map((node) => node.textContent || node.innerHTML || "").join("\n");
  assert.match(styleContent, /--lpk-status-col-min-width: 200px/);
  assert.match(styleContent, /--lpk-appbar-height:/);
  assert.match(styleContent, /\.kanban-appbar/);
  assert.match(styleContent, /\.kanban-board__container/);
  assert.match(container.innerHTML, /kanban-board__container/);
});
