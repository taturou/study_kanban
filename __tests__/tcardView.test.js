import assert from "node:assert/strict";
import { test } from "vitest";
import { buildCardViewModel, isSquareCard } from "../src/card/tcardView";

const taskBase = {
  id: "t1",
  title: "Sample",
  estimateMinutes: 60,
  actualMinutes: 15,
  dueAt: "2025-12-20",
};

test("InPro は正方形、それ以外は横長", () => {
  assert.equal(isSquareCard("InPro"), true);
  assert.equal(isSquareCard("Today"), false);
});

test("カード表示モデルにタイトル・期日曜日・ゲージ値を含む", () => {
  const model = buildCardViewModel({ ...taskBase, status: "Today" });
  assert.equal(model.title, "Sample");
  assert.equal(model.dueWeekday, "土");
  assert.equal(model.gauge.estimate, 60);
  assert.equal(model.gauge.actual, 15);
  assert.equal(model.shape, "rect");
});

test("InPro ステータスは shape が square になり、ゲージは共通で計算される", () => {
  const model = buildCardViewModel({ ...taskBase, status: "InPro" });
  assert.equal(model.shape, "square");
});
