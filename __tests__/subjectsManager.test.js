import assert from "node:assert/strict";
import { test, beforeEach } from "vitest";
import {
  createSubjectsManager,
  SUBJECT_DELETE_BLOCK_MESSAGE,
} from "../src/subjects/manager";

let manager;

beforeEach(() => {
  manager = createSubjectsManager();
});

test("教科並び順をスプリント単位で保存・復元できる", () => {
  const sprintA = "sprint-A";
  const sprintB = "sprint-B";
  manager.setOrder(sprintA, ["English", "Math", "Science"]);
  manager.setOrder(sprintB, ["Science", "English"]);

  assert.deepEqual(manager.getOrder(sprintA), ["English", "Math", "Science"]);
  assert.deepEqual(manager.getOrder(sprintB), ["Science", "English"]);
});

test("タスクが存在する教科の削除をブロックする", () => {
  manager.setOrder("sprint-A", ["English", "Math"]);
  const tasksBySubject = {
    English: [{ id: "t1" }],
  };
  assert.throws(() => manager.deleteSubject("sprint-A", "English", tasksBySubject), {
    message: SUBJECT_DELETE_BLOCK_MESSAGE,
  });
});

test("タスクが無い教科は削除でき、順序を維持する", () => {
  manager.setOrder("sprint-A", ["English", "Math", "Science"]);
  const next = manager.deleteSubject("sprint-A", "Science", {});
  assert.deepEqual(next, ["English", "Math"]);
  assert.deepEqual(manager.getOrder("sprint-A"), ["English", "Math"]);
});
