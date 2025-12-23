import assert from "node:assert/strict";
import { beforeEach, test, vi } from "vitest";
import { createKanbanController } from "../src/kanban/controller";

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

test("保存時に createdAt/updatedAt を付与し更新で updatedAt を更新する", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-01-16T10:00:00Z"));

  controller.openNewTaskDialog({ subjectId: "English", status: "Backlog" });
  const created = controller.saveDialog({ title: "Task A", dueAt: "2025-01-16" });

  const tasks = controller.getTasksByCell("English", "Backlog");
  assert.ok(tasks[0].createdAt);
  assert.ok(tasks[0].updatedAt);
  const firstUpdatedAt = tasks[0].updatedAt;

  vi.setSystemTime(new Date("2025-01-17T10:00:00Z"));
  controller.openEditTaskDialog(created.taskId);
  controller.saveDialog({ title: "Task B" });
  const updated = controller.getTasksByCell("English", "Backlog");
  assert.notEqual(updated[0].updatedAt, firstUpdatedAt);

  vi.useRealTimers();
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
