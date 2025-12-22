import assert from "node:assert/strict";
import { test } from "vitest";
import { computeRemainingMinutes, summarizeLoad } from "../src/time/timeCalc";

test("残り時間は予定 - 実績で計算し負値は 0 に丸める", () => {
  const task = {
    estimateMinutes: 60,
    actuals: [{ minutes: 40 }, { minutes: 30 }],
  };
  assert.equal(computeRemainingMinutes(task), 0);
});

test("Today/InPro/OnHold の残り時間合計と過負荷を判定する", () => {
  const tasks = [
    { status: "Today", estimateMinutes: 60, actualMinutes: 10 },
    { status: "InPro", estimateMinutes: 30, actualMinutes: 0 },
    { status: "Backlog", estimateMinutes: 120, actualMinutes: 0 },
  ];
  const summary = summarizeLoad({
    tasks,
    availableMinutes: 70,
    inProExtraMinutesByTaskId: {},
  });

  assert.equal(summary.remainingMinutes, 80);
  assert.equal(summary.overload, true);
  assert.equal(summary.remainingAvailableMinutes, 0);
});
