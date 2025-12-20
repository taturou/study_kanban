import { createTaskStore, PRIORITY_STEP } from "../store/taskStore.js";
import { createSettingsStore } from "../settings/store.js";
import { createSubjectsManager, SUBJECT_DELETE_BLOCK_MESSAGE } from "../subjects/manager.js";
import { createTaskDialogState, saveTask, deleteTask as deleteDialogTask } from "../dialog/taskDialogFlow.js";
import { computeSprintRange, formatSprintRange } from "../sprint/range.js";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function buildTasksBySubject(tasks) {
  return tasks.reduce((acc, task) => {
    if (!acc[task.subjectId]) acc[task.subjectId] = [];
    acc[task.subjectId].push(task);
    return acc;
  }, {});
}

function computeTailPriority(cellTasks) {
  if (!cellTasks.length) return PRIORITY_STEP;
  const minPriority = Math.min(...cellTasks.map((task) => task.priority ?? PRIORITY_STEP));
  return minPriority - PRIORITY_STEP;
}

export function createKanbanController({ subjects, now = new Date(), settings = {}, tasks = [] }) {
  const store = createTaskStore();
  const settingsStore = createSettingsStore(settings);
  const subjectsManager = createSubjectsManager();
  const sprintRange = computeSprintRange(now);
  const sprintId = sprintRange.start.toISOString().slice(0, 10);

  subjectsManager.setOrder(sprintId, subjects);
  tasks.forEach((task) => store.addTask(task));

  let dialogState = null;

  function getSubjects() {
    const order = subjectsManager.getOrder(sprintId);
    return order.length ? order : [...subjects];
  }

  function openNewTaskDialog({ subjectId, status }) {
    dialogState = createTaskDialogState({ mode: "new", subjectId, status });
    return dialogState;
  }

  function openEditTaskDialog(taskId) {
    const task = store.getTask(taskId);
    if (!task) return null;
    dialogState = createTaskDialogState({ mode: "edit", subjectId: task.subjectId, status: task.status, task });
    return dialogState;
  }

  function closeDialog() {
    dialogState = null;
  }

  function saveDialog(updates) {
    if (!dialogState) return { ok: false, reason: "dialog-not-open" };
    const result = saveTask(dialogState, updates);
    if (result.action !== "save") return { ok: false, reason: "invalid-action" };

    const task = { ...result.task };
    if (!task.id) task.id = generateId();
    if (task.actuals) {
      task.actualMinutes = task.actuals.reduce((sum, actual) => sum + (actual.minutes ?? 0), 0);
    }

    if (dialogState.mode === "edit") {
      store.updateTask(task.id, task);
    } else {
      const cellTasks = store.getTasksByCell(task.subjectId, task.status);
      const priority = computeTailPriority(cellTasks);
      store.addTask({ ...task, priority });
    }

    dialogState = null;
    return { ok: true, taskId: task.id };
  }

  function deleteDialogTask() {
    if (!dialogState) return { ok: false, reason: "dialog-not-open" };
    const result = deleteDialogTask(dialogState);
    if (result.action === "delete") {
      store.deleteTask(result.taskId);
      dialogState = null;
      return { ok: true };
    }
    return { ok: false };
  }

  function updateStatusLabel(status, label) {
    return settingsStore.setStatusLabel(status, label);
  }

  function setSubjectOrder(order) {
    return subjectsManager.setOrder(sprintId, order);
  }

  function deleteSubject(subjectId) {
    const tasksBySubject = buildTasksBySubject(store.listTasks());
    try {
      return subjectsManager.deleteSubject(sprintId, subjectId, tasksBySubject);
    } catch (error) {
      if (error?.message === SUBJECT_DELETE_BLOCK_MESSAGE) {
        return { ok: false, reason: error.message };
      }
      throw error;
    }
  }

  return {
    openNewTaskDialog,
    openEditTaskDialog,
    closeDialog,
    saveDialog,
    deleteDialogTask,
    previewMove: (input) => store.previewMove(input),
    moveTask: (input) => store.moveTask(input),
    getTasksByCell: (subjectId, status) => store.getTasksByCell(subjectId, status),
    listTasks: () => store.listTasks(),
    getStatusLabels: () => settingsStore.getStatusLabels(),
    updateStatusLabel,
    getSprintLabel: () => formatSprintRange(sprintRange),
    getSubjects,
    setSubjectOrder,
    deleteSubject,
    getDialogState: () => (dialogState ? { ...dialogState } : null),
  };
}
