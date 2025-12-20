import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { createKanbanController } from "../src/kanban/controller.js";

let controller;

beforeEach(() => {
  controller = createKanbanController({
    subjects: ["English"],
    now: new Date("2025-01-15T10:00:00Z"),
  });
});

test("Backlog の新規ダイアログ保存で TCard が追加される", () => {
  controller.openNewTaskDialog({ subjectId: "English", status: "Backlog" });
  controller.saveDialog({
    title: "Task A",
    detail: "Detail",
    dueAt: "2025-01-16",
    estimateMinutes: 30,
  });

  const tasks = controller.getTasksByCell("English", "Backlog");
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].title, "Task A");
});

test("TCard 編集ダイアログで内容を更新できる", () => {
  controller.openNewTaskDialog({ subjectId: "English", status: "Backlog" });
  const created = controller.saveDialog({
    title: "Task A",
    dueAt: "2025-01-16",
    estimateMinutes: 30,
  });

  controller.openEditTaskDialog(created.taskId);
  controller.saveDialog({ title: "Task B" });

  const tasks = controller.getTasksByCell("English", "Backlog");
  assert.equal(tasks[0].title, "Task B");
});

test("DnD プレビューがポリシー違反時に理由を返す", () => {
  controller.openNewTaskDialog({ subjectId: "English", status: "Today" });
  controller.saveDialog({ title: "Top", dueAt: "2025-01-16" });
  controller.openNewTaskDialog({ subjectId: "English", status: "Today" });
  const second = controller.saveDialog({ title: "Second", dueAt: "2025-01-16" });

  const preview = controller.previewMove({
    taskId: second.taskId,
    to: { subjectId: "English", status: "InPro", insertIndex: 0 },
  });
  assert.equal(preview.allowed, false);
  assert.match(preview.reason, /today-not-top/);
});

test("ステータス表示名は Settings から更新できる", () => {
  const labels = controller.updateStatusLabel("Backlog", "あとで");
  assert.equal(labels.Backlog, "あとで");
});
