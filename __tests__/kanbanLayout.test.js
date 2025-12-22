import assert from "node:assert/strict";
import { test } from "vitest";
import {
  createKanbanLayoutConfig,
  guardStatusOrder,
  PERFORMANCE_BASELINE,
  calculateScrollDuringEmptyDrag,
  shouldShowInsertPreview,
  SUBJECT_WIDTH,
} from "../src/kanban/layout";
import { STATUS_ORDER } from "../src/status/policy";

test("ステータス順序は固定で変更できない", () => {
  assert.deepEqual(STATUS_ORDER, ["Backlog", "Today", "InPro", "OnHold", "Done", "WontFix"]);
  assert.throws(
    () => guardStatusOrder(["Today", "Backlog", "InPro", "OnHold", "Done", "WontFix"]),
    /固定/,
  );
  assert.doesNotThrow(() => guardStatusOrder([...STATUS_ORDER]));
});

test("レイアウト設定はヘッダー固定とコンテナスクロールを有効にし、ステータス列をピン留めする", () => {
  const config = createKanbanLayoutConfig({
    subjects: ["English", "Math"],
    viewportWidth: 2000,
  });
  assert.equal(config.headerFixed, true);
  assert.equal(config.containerScroll, true);
  assert.equal(config.pinned.statusColumns, true);
  assert.equal(config.pinned.subjectColumn, false);
  assert.equal(config.grid.minColumnWidth, 200);
  assert.equal(config.grid.minCardTitleLength, 10);
  assert.equal(config.scroll.horizontal, false);
  assert.ok(config.grid.template);
  assert.ok(config.grid.statusWidths);
  const available = 2000 - SUBJECT_WIDTH;
  const equal = Math.floor(available / STATUS_ORDER.length);
  assert.equal(config.grid.statusWidths[0], equal);
});

test("性能基準に合わせて教科14・各セル35枚を基準とする", () => {
  assert.equal(PERFORMANCE_BASELINE.subjects, 14);
  assert.equal(PERFORMANCE_BASELINE.cardsPerCell, 35);
});

test("空白ドラッグでスクロール量を計算し、0 未満にはならない", () => {
  const next = calculateScrollDuringEmptyDrag({
    current: { x: 0, y: 10 },
    dragDeltaX: 120,
    dragDeltaY: -30,
  });
  assert.deepEqual(next, { x: 120, y: 0 });
});

test("挿入プレビューは性能基準以内で表示される", () => {
  const preview = shouldShowInsertPreview({
    subjects: PERFORMANCE_BASELINE.subjects,
    cardsPerCell: PERFORMANCE_BASELINE.cardsPerCell,
  });
  assert.equal(preview, true);
});

test("画面幅に応じてステータス列の幅を計算する（広い場合は均等割り）", () => {
  const config = createKanbanLayoutConfig({ subjects: ["English"], viewportWidth: 2000 });
  const available = 2000 - SUBJECT_WIDTH;
  const equal = Math.floor(available / STATUS_ORDER.length);
  assert.equal(config.scroll.horizontal, false);
  assert.equal(config.grid.statusWidths.length, STATUS_ORDER.length);
  assert.equal(config.grid.statusWidths[0], equal);
  assert.equal(
    config.grid.statusWidths.reduce((sum, w) => sum + w, 0),
    available,
  );
});

test("狭い幅では Today/InPro/OnHold を固定幅、Backlog/Done/WontFix を狭め、横スクロールは無効", () => {
  const config = createKanbanLayoutConfig({ subjects: ["English"], viewportWidth: 1200 });
  assert.equal(config.scroll.horizontal, false);
  const widths = config.grid.statusWidths;
  assert.deepEqual(widths, [140, 200, 200, 200, 140, 140]);
});

test("極端に狭い場合は横スクロールを許容し、最小幅でレンダリングする", () => {
  const config = createKanbanLayoutConfig({ subjects: ["English"], viewportWidth: 800 });
  assert.equal(config.scroll.horizontal, true);
  assert.deepEqual(config.grid.statusWidths, [140, 200, 200, 200, 140, 140]);
});
