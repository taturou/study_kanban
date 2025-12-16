import assert from "node:assert/strict";
import { test } from "node:test";
import {
  STATUS_ORDER,
  createKanbanLayoutConfig,
  guardStatusOrder,
  PERFORMANCE_BASELINE,
  calculateScrollDuringEmptyDrag,
  shouldShowInsertPreview,
} from "../src/kanban/layout.js";

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
    viewportWidth: 1024,
  });
  assert.equal(config.headerFixed, true);
  assert.equal(config.containerScroll, true);
  assert.equal(config.pinned.statusColumns, true);
  assert.equal(config.pinned.subjectColumn, true);
  assert.equal(config.grid.minColumnWidth, 240);
  assert.equal(config.grid.minCardTitleLength, 10);
  assert.equal(config.scroll.horizontal, true);
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
