import assert from "node:assert/strict";
import { test } from "vitest";
import { addTaskToLab, createLabState, moveTaskInLab, summarizeLabState } from "../src/e2e/labState";

test("初期状態はバックログにサンプルタスクを1件持つ", () => {
  const state = createLabState();
  assert.equal(state.tasks.Backlog.length, 1);
  assert.equal(state.tasks.Today.length, 0);
  assert.equal(state.tasks.Done.length, 0);
});

test("タスク追加でバックログに新規カードが追加されIDが採番される", () => {
  let state = createLabState();
  state = addTaskToLab(state, "新しいタスク");
  assert.equal(state.tasks.Backlog.length, 2);
  const titles = state.tasks.Backlog.map((t) => t.title);
  assert.ok(titles.includes("新しいタスク"));
  const ids = new Set(state.tasks.Backlog.map((t) => t.id));
  assert.equal(ids.size, state.tasks.Backlog.length);
});

test("タスクのステータスを移動するとステータス別件数が更新される", () => {
  let state = createLabState();
  const taskId = state.tasks.Backlog[0].id;
  state = moveTaskInLab(state, taskId, "Today");
  assert.equal(state.tasks.Backlog.length, 0);
  assert.equal(state.tasks.Today.length, 1);

  state = moveTaskInLab(state, taskId, "Done");
  assert.equal(state.tasks.Today.length, 0);
  assert.equal(state.tasks.Done.length, 1);

  const summary = summarizeLabState(state);
  assert.deepEqual(summary, {
    Backlog: 0,
    Today: 0,
    Done: 1,
  });
});
