import { createTaskStore, PRIORITY_STEP } from "../store/taskStore.js";
import { createSettingsStore } from "../settings/store.js";
import { createSubjectsManager, SUBJECT_DELETE_BLOCK_MESSAGE } from "../subjects/manager.js";
import { createTaskDialogState, saveTask, deleteTask as deleteDialogTaskFlow } from "../dialog/taskDialogFlow.js";
import { computeSprintRange, formatSprintRange } from "../sprint/range.js";
import { createInProAutoTracker } from "../time/inProTracker.js";
import { createPomodoroTimer } from "../time/pomodoroTimer.js";
import { summarizeLoad, sumActualMinutes } from "../time/timeCalc.js";

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
  const inProTracker = createInProAutoTracker();
  const alerts = [];
  const pomodoroTimer = createPomodoroTimer({
    onNotify: (event) => {
      alerts.push(event);
    },
  });
  const sprintRange = computeSprintRange(now);
  const sprintId = sprintRange.start.toISOString().slice(0, 10);
  let overloadActive = false;
  let lastPomodoroRemaining = pomodoroTimer.getSnapshot().remainingMinutes;

  subjectsManager.setOrder(sprintId, subjects);
  tasks.forEach((task) => store.addTask(task));
  syncInProTracking();
  refreshLoadAlerts();

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

  function appendAutoActual(taskId, minutes) {
    const task = store.getTask(taskId);
    if (!task) return null;
    const actuals = Array.isArray(task.actuals) ? task.actuals : [];
    const actual = {
      id: generateId(),
      at: new Date().toISOString().slice(0, 10),
      minutes,
    };
    const nextActuals = [...actuals, actual];
    const actualMinutes = sumActualMinutes({ actuals: nextActuals });
    store.updateTask(taskId, { actuals: nextActuals, actualMinutes });
    return actual;
  }

  function syncInProTracking() {
    const inProTask = store.listTasks().find((task) => task.status === "InPro");
    const flush = inProTracker.setActiveTask(inProTask?.id ?? null);
    if (flush) appendAutoActual(flush.taskId, flush.minutes);
  }

  function getAvailabilitySummary() {
    const tasksSnapshot = store.listTasks();
    const inProTaskId = inProTracker.getActiveTaskId();
    const inProExtra = inProTaskId ? { [inProTaskId]: inProTracker.getPendingMinutes() } : {};
    return summarizeLoad({
      tasks: tasksSnapshot,
      availableMinutes: 120,
      inProExtraMinutesByTaskId: inProExtra,
    });
  }

  function refreshLoadAlerts() {
    const summary = getAvailabilitySummary();
    if (summary.overload && !overloadActive) {
      alerts.push({ type: "load-overflow" });
    }
    overloadActive = summary.overload;
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

    syncInProTracking();
    refreshLoadAlerts();
    dialogState = null;
    return { ok: true, taskId: task.id };
  }

  function deleteDialogTask() {
    if (!dialogState) return { ok: false, reason: "dialog-not-open" };
    const result = deleteDialogTaskFlow(dialogState);
    if (result.action === "delete") {
      store.deleteTask(result.taskId);
      syncInProTracking();
      refreshLoadAlerts();
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
    moveTask: (input) => {
      const result = store.moveTask(input);
      if (result.ok) {
        syncInProTracking();
        refreshLoadAlerts();
      }
      return result;
    },
    getTasksByCell: (subjectId, status) => store.getTasksByCell(subjectId, status),
    listTasks: () => {
      const inProTaskId = inProTracker.getActiveTaskId();
      const inProElapsedMinutes = inProTracker.getSessionMinutes();
      const inProPendingMinutes = inProTracker.getPendingMinutes();
      return store.listTasks().map((task) =>
        task.id === inProTaskId
          ? { ...task, inProElapsedMinutes, inProPendingMinutes }
          : { ...task },
      );
    },
    getStatusLabels: () => settingsStore.getStatusLabels(),
    updateStatusLabel,
    getSprintLabel: () => formatSprintRange(sprintRange),
    getSubjects,
    setSubjectOrder,
    deleteSubject,
    getDialogState: () => (dialogState ? { ...dialogState } : null),
    getAvailabilitySummary,
    getPomodoroSnapshot: () => pomodoroTimer.getSnapshot(),
    setPomodoroSettings: ({ workMinutes, breakMinutes }) =>
      pomodoroTimer.updateSettings({ nextWorkMinutes: workMinutes, nextBreakMinutes: breakMinutes }),
    triggerPomodoro: (action) => {
      if (action === "start") pomodoroTimer.start();
      if (action === "pause") pomodoroTimer.pause();
      if (action === "reset") pomodoroTimer.reset();
    },
    tickTimers: () => {
      const beforeSession = inProTracker.getSessionMinutes();
      const beforePomodoro = lastPomodoroRemaining;
      const flush = inProTracker.tick();
      if (flush) appendAutoActual(flush.taskId, flush.minutes);
      pomodoroTimer.tick();
      refreshLoadAlerts();
      const afterSession = inProTracker.getSessionMinutes();
      const afterPomodoro = pomodoroTimer.getSnapshot().remainingMinutes;
      lastPomodoroRemaining = afterPomodoro;
      return beforeSession !== afterSession || beforePomodoro !== afterPomodoro || Boolean(flush);
    },
    consumeAlerts: () => {
      const current = alerts.splice(0, alerts.length);
      return current;
    },
  };
}
