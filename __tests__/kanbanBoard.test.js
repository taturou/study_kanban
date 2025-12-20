import assert from "node:assert/strict";
import { test } from "node:test";
import { createKanbanLayoutConfig, STATUS_ORDER } from "../src/kanban/layout.js";
import { renderKanbanBoard } from "../src/kanban/board.js";

test("固定ステータス×教科のグリッドを描画する", () => {
  const subjects = ["English", "Math"];
  const layout = createKanbanLayoutConfig({ subjects, viewportWidth: 320 });

  const html = renderKanbanBoard({ subjects, layout });

  STATUS_ORDER.forEach((status) => {
    assert.match(html, new RegExp(`data-status="${status}"`));
  });
  subjects.forEach((subject) => {
    assert.match(html, new RegExp(`data-subject="${subject}"`));
  });
  assert.doesNotMatch(html, /data-testid="placeholder-card"/);
  assert.match(html, /data-header-fixed="true"/);
  assert.match(html, /data-pinned-subject-column="false"/);
});

test("レイアウト設定に応じてヘッダー固定・横スクロール・ステータス列の最小幅を反映する", () => {
  const subjects = ["English"];
  const narrowLayout = createKanbanLayoutConfig({ subjects, viewportWidth: 800 });
  const narrowHtml = renderKanbanBoard({ subjects, layout: narrowLayout });
  assert.match(narrowHtml, /data-scroll-horizontal="true"/);
  assert.match(narrowHtml, new RegExp(`min-width:${narrowLayout.grid.minColumnWidth}px`));

  const wideLayout = createKanbanLayoutConfig({ subjects, viewportWidth: 2000 });
  const wideHtml = renderKanbanBoard({ subjects, layout: wideLayout });
  assert.match(wideHtml, /data-scroll-horizontal="false"/);
  assert.match(wideHtml, /data-header-fixed="true"/);
  assert.match(wideHtml, /data-pinned-status-columns="true"/);
  assert.match(wideHtml, new RegExp(`grid-template-columns`));
});

test("ステータス幅と総幅をヘッダー・セルで共有し、不要な横スクロールを防ぐ", () => {
  const subjects = ["English"];
  const layout = createKanbanLayoutConfig({ subjects, viewportWidth: 1200 });

  const html = renderKanbanBoard({ subjects, layout });

  assert.match(html, new RegExp(`--lpk-total-width:${layout.grid.totalWidth}px`));
  const templatePattern = layout.grid.template.replace(/\s+/g, "\\s*");
  assert.match(html, new RegExp(`grid-template-columns:${templatePattern}`));
  assert.match(html, new RegExp(`class="kanban-row"[^>]*min-width:${layout.grid.totalWidth}px`));
  assert.match(
    html,
    new RegExp(`data-status="Backlog"[^>]*style="[^"]*width:${layout.grid.statusWidths[0]}px`),
  );
});
