import assert from "node:assert/strict";
import { test } from "node:test";
import { createKanbanLayoutConfig, STATUS_ORDER } from "../src/kanban/layout.js";
import { renderKanbanBoard } from "../src/kanban/board.js";

test("固定ステータス×教科のグリッドにプレースホルダー TCard を配置する", () => {
  const subjects = ["English", "Math"];
  const layout = createKanbanLayoutConfig({ subjects, viewportWidth: 320 });

  const html = renderKanbanBoard({ subjects, layout });

  STATUS_ORDER.forEach((status) => {
    assert.match(html, new RegExp(`data-status="${status}"`));
  });
  subjects.forEach((subject) => {
    assert.match(html, new RegExp(`data-subject="${subject}"`));
  });
  const placeholderCount = (html.match(/data-testid="placeholder-card"/g) ?? []).length;
  assert.equal(placeholderCount, STATUS_ORDER.length * subjects.length);
  assert.match(html, /data-header-fixed="true"/);
  assert.match(html, /data-pinned-subject-column="true"/);
});

test("レイアウト設定に応じてヘッダー固定・横スクロール・ステータス列の最小幅を反映する", () => {
  const subjects = ["English"];
  const narrowLayout = createKanbanLayoutConfig({ subjects, viewportWidth: 200 });
  const narrowHtml = renderKanbanBoard({ subjects, layout: narrowLayout });
  assert.match(narrowHtml, /data-scroll-horizontal="true"/);
  assert.match(narrowHtml, new RegExp(`min-width:${narrowLayout.grid.minColumnWidth}px`));

  const wideLayout = createKanbanLayoutConfig({ subjects, viewportWidth: 2000 });
  const wideHtml = renderKanbanBoard({ subjects, layout: wideLayout });
  assert.match(wideHtml, /data-scroll-horizontal="false"/);
  assert.match(wideHtml, /data-header-fixed="true"/);
  assert.match(wideHtml, /data-pinned-status-columns="true"/);
});
