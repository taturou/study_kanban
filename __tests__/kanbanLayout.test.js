import assert from "node:assert/strict";
import { test } from "node:test";
import {
  STATUS_ORDER,
  createKanbanLayoutConfig,
  guardStatusOrder,
  PERFORMANCE_BASELINE,
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
  });
  assert.equal(config.headerFixed, true);
  assert.equal(config.containerScroll, true);
  assert.equal(config.pinned.statusColumns, true);
  assert.equal(config.pinned.subjectColumn, true);
  assert.equal(config.grid.minColumnWidth, 240);
  assert.equal(config.grid.minCardTitleLength, 10);
});

test("性能基準に合わせて教科14・各セル35枚を基準とする", () => {
  assert.equal(PERFORMANCE_BASELINE.subjects, 14);
  assert.equal(PERFORMANCE_BASELINE.cardsPerCell, 35);
});
