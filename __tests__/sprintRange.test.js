import assert from "node:assert/strict";
import { test } from "node:test";
import { computeSprintRange, formatSprintRange } from "../src/sprint/range.js";

const iso = (d) => d.toISOString().slice(0, 10);

test("参照日から月曜始まり1週間の開始/終了日を計算する", () => {
  const base = new Date("2025-12-17T10:00:00Z"); // 水曜
  const range = computeSprintRange(base);
  assert.equal(iso(range.start), "2025-12-15"); // 月曜
  assert.equal(iso(range.end), "2025-12-21"); // 日曜
  const diffDays = (range.end - range.start) / (1000 * 60 * 60 * 24) + 1;
  assert.equal(diffDays, 7);
});

test("既に月曜の場合は同じ週を返す", () => {
  const monday = new Date("2025-12-15T00:00:00Z");
  const range = computeSprintRange(monday);
  assert.equal(iso(range.start), "2025-12-15");
  assert.equal(iso(range.end), "2025-12-21");
});

test("期間表示を YYYY-MM-DD 〜 YYYY-MM-DD で返す", () => {
  const range = computeSprintRange(new Date("2025-12-17T10:00:00Z"));
  const text = formatSprintRange(range);
  assert.equal(text, "2025-12-15 〜 2025-12-21");
});
