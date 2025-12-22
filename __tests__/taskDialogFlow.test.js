import assert from "node:assert/strict";
import { beforeEach, test } from "vitest";
import {
  createTaskDialogState,
  tabOrder,
  focusNextField,
  handleKeyboard,
  saveTask,
  cancelDialog,
  deleteTask,
} from "../src/dialog/taskDialogFlow";

let state;

beforeEach(() => {
  state = createTaskDialogState({
    mode: "new",
    subjectId: "English",
    status: "Backlog",
  });
});

test("新規ダイアログはタイトルに初期フォーカスし、Tab 順序を辿れる", () => {
  assert.equal(state.focus, "title");
  assert.deepEqual(tabOrder, ["title", "detail", "dueAt", "estimateMinutes", "actions"]);
  const next = focusNextField(state.focus);
  assert.equal(next, "detail");
});

test("Ctrl+Enter で保存、Esc でキャンセルを返す", () => {
  const saved = handleKeyboard(state, { ctrlKey: true, key: "Enter" });
  assert.equal(saved.action, "save");
  const cancelled = handleKeyboard(state, { key: "Escape" });
  assert.equal(cancelled.action, "cancel");
});

test("保存時は対象セル末尾への挿入位置を返す", () => {
  const result = saveTask(state, { title: "Task A" });
  assert.equal(result.action, "save");
  assert.equal(result.insertPosition, "end");
  assert.equal(result.task.title, "Task A");
  assert.equal(result.task.subjectId, "English");
  assert.equal(result.task.status, "Backlog");
});

test("編集時は既存の id を保持し、削除操作を返せる", () => {
  const editState = createTaskDialogState({
    mode: "edit",
    subjectId: "Math",
    status: "Today",
    task: { id: "t1", title: "Old" },
  });
  const result = saveTask(editState, { title: "Updated" });
  assert.equal(result.task.id, "t1");
  assert.equal(result.task.title, "Updated");
  const del = deleteTask(editState);
  assert.equal(del.action, "delete");
  assert.equal(del.taskId, "t1");
});

test("Backlog 以外からもキャンセル操作を返せる", () => {
  const cancelResult = cancelDialog(state);
  assert.equal(cancelResult.action, "cancel");
});
