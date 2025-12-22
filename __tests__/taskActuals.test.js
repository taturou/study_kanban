import assert from "node:assert/strict";
import { beforeEach, test } from "vitest";
import {
  createActualsState,
  addActual,
  updateActual,
  deleteActual,
} from "../src/time/taskActuals";

let actuals;

beforeEach(() => {
  actuals = createActualsState();
});

test("実績を追加すると累計が増える", () => {
  const next = addActual(actuals, { at: "2025-12-16", minutes: 30 });
  assert.equal(next.totalMinutes, 30);
  assert.equal(next.items.length, 1);
});

test("実績を更新すると累計が再計算される", () => {
  let next = addActual(actuals, { id: "a1", at: "2025-12-16", minutes: 20 });
  next = updateActual(next, { id: "a1", minutes: 45 });
  assert.equal(next.totalMinutes, 45);
});

test("実績を削除できる", () => {
  let next = addActual(actuals, { id: "a1", at: "2025-12-16", minutes: 20 });
  next = addActual(next, { id: "a2", at: "2025-12-17", minutes: 10 });
  next = deleteActual(next, "a1");
  assert.equal(next.items.length, 1);
  assert.equal(next.totalMinutes, 10);
});
