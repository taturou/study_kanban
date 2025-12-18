import assert from "node:assert/strict";
import { test } from "node:test";
import { getDropFeedback } from "../src/kanban/dnd.js";
import { createTaskStore } from "../src/store/taskStore.js";

test("許可されないセルはハイライトせず理由を返す", () => {
  const store = createTaskStore();
  store.addTask({ id: "t1", title: "Today top", subjectId: "英語", status: "Today", priority: 3000 });
  store.addTask({ id: "t2", title: "Today second", subjectId: "英語", status: "Today", priority: 2000 });

  const feedback = getDropFeedback(store, { taskId: "t2", to: { subjectId: "英語", status: "InPro", insertIndex: 0 } });
  assert.equal(feedback.highlight, false);
  assert.match(feedback.reason, /today-not-top/);
});

test("許可されるセルはハイライトを返し、moveTask と整合する", () => {
  const store = createTaskStore();
  store.addTask({ id: "t1", title: "Today top", subjectId: "英語", status: "Today", priority: 3000 });
  const okFeedback = getDropFeedback(store, { taskId: "t1", to: { subjectId: "英語", status: "InPro", insertIndex: 0 } });
  assert.equal(okFeedback.highlight, true);
  const move = store.moveTask({ taskId: "t1", to: { subjectId: "英語", status: "InPro", insertIndex: 0 } });
  assert.equal(move.ok, true);
});
