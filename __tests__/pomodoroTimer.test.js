import assert from "node:assert/strict";
import { test } from "node:test";
import { createPomodoroTimer } from "../src/time/pomodoroTimer.js";

function createClock(start = "2025-01-01T00:00:00Z") {
  let current = new Date(start);
  return {
    now: () => new Date(current),
    advanceMinutes: (minutes) => {
      current = new Date(current.getTime() + minutes * 60 * 1000);
    },
  };
}

test("ポモドーロ開始と終了・休憩開始を通知する", () => {
  const clock = createClock();
  const events = [];
  const timer = createPomodoroTimer({
    workMinutes: 1,
    breakMinutes: 1,
    now: clock.now,
    onNotify: (event) => events.push(event),
  });

  timer.start();
  assert.equal(events[0]?.type, "pomodoro-started");

  clock.advanceMinutes(1);
  timer.tick();
  assert.equal(events[1]?.type, "pomodoro-finished");
  assert.equal(events[2]?.type, "pomodoro-break-started");

  clock.advanceMinutes(1);
  timer.tick();
  assert.equal(events[3]?.type, "pomodoro-break-finished");
  assert.equal(timer.getSnapshot().state, "idle");
});

test("一時停止と再開で残り時間を保持する", () => {
  const clock = createClock();
  const timer = createPomodoroTimer({ workMinutes: 5, breakMinutes: 1, now: clock.now });

  timer.start();
  clock.advanceMinutes(2);
  timer.pause();
  const paused = timer.getSnapshot();

  clock.advanceMinutes(10);
  timer.start();
  const resumed = timer.getSnapshot();

  assert.equal(paused.remainingMinutes, 3);
  assert.equal(resumed.remainingMinutes, 3);
});
