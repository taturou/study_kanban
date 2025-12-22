import assert from "node:assert/strict";
import { test } from "node:test";
import { createInProAutoTracker } from "../src/time/inProTracker.js";

function createClock(start = "2025-01-01T00:00:00Z") {
  let current = new Date(start);
  return {
    now: () => new Date(current),
    advanceMinutes: (minutes) => {
      current = new Date(current.getTime() + minutes * 60 * 1000);
    },
  };
}

test("InPro の自動計測は 1 分刻みでセッション時間を増やす", () => {
  const clock = createClock();
  const tracker = createInProAutoTracker({ now: clock.now, flushIntervalMinutes: 5 });

  tracker.setActiveTask("task-1");
  clock.advanceMinutes(1);
  tracker.tick();

  assert.equal(tracker.getSessionMinutes(), 1);
  assert.equal(tracker.getPendingMinutes(), 1);
});

test("一定間隔でバッチ反映イベントを返す", () => {
  const clock = createClock();
  const tracker = createInProAutoTracker({ now: clock.now, flushIntervalMinutes: 5 });

  tracker.setActiveTask("task-1");
  clock.advanceMinutes(5);
  const flush = tracker.tick();

  assert.deepEqual(flush, { taskId: "task-1", minutes: 5 });
  assert.equal(tracker.getPendingMinutes(), 0);
});

test("停止時に未反映分をフラッシュする", () => {
  const clock = createClock();
  const tracker = createInProAutoTracker({ now: clock.now, flushIntervalMinutes: 10 });

  tracker.setActiveTask("task-1");
  clock.advanceMinutes(3);
  tracker.tick();
  const flush = tracker.stop();

  assert.deepEqual(flush, { taskId: "task-1", minutes: 3 });
  assert.equal(tracker.getSessionMinutes(), 0);
  assert.equal(tracker.getPendingMinutes(), 0);
});
