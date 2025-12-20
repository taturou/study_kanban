import { createStatusPolicy } from "../status/policy.js";

export const PRIORITY_STEP = 1024;

function sortByPriority(tasks) {
  return [...tasks].sort((a, b) => b.priority - a.priority);
}

function normalizeCell(tasks) {
  return tasks.map((task, index) => ({
    ...task,
    priority: PRIORITY_STEP * (tasks.length - index),
  }));
}

export function createTaskStore(policy = createStatusPolicy()) {
  let tasks = [];

  function getTask(taskId) {
    return tasks.find((t) => t.id === taskId);
  }

  function getTasksByCell(subjectId, status) {
    return sortByPriority(tasks.filter((t) => t.subjectId === subjectId && t.status === status));
  }

  function setCell(subjectId, status, cellTasks) {
    tasks = tasks.filter((t) => !(t.subjectId === subjectId && t.status === status)).concat(cellTasks);
  }

  function addTask(task) {
    const priority = typeof task.priority === "number" ? task.priority : PRIORITY_STEP;
    tasks.push({ ...task, priority });
    return getTask(task.id);
  }

  function buildContext(task) {
    const today = getTasksByCell(task.subjectId, "Today");
    const onHold = getTasksByCell(task.subjectId, "OnHold");
    const inPro = tasks.filter((t) => t.status === "InPro");
    const topToday = today[0]?.id;
    const topOnHold = onHold[0]?.id;
    const otherInPro = inPro.find((t) => t.id !== task.id);
    return {
      hasOtherInPro: Boolean(otherInPro),
      inProTaskId: otherInPro?.id,
      inProSubjectId: otherInPro?.subjectId,
      isTopOfToday: topToday === task.id,
      isTopOfOnHold: topOnHold === task.id,
    };
  }

  function applySideEffects(effects) {
    for (const effect of effects ?? []) {
      if (effect.kind === "autoMoveToOnHold") {
        const target = getTask(effect.taskId);
        if (!target) continue;
        placeTaskOnHoldTop(target, effect.subjectId);
      }
      if (effect.kind === "normalizePriorities") {
        const cell = getTasksByCell(effect.subjectId, effect.status);
        setCell(effect.subjectId, effect.status, normalizeCell(cell));
      }
    }
  }

  function placeTaskOnHoldTop(task, subjectOverride) {
    const subjectId = subjectOverride ?? task.subjectId;
    const cell = getTasksByCell(subjectId, "OnHold").filter((t) => t.id !== task.id);
    const next = normalizeCell([{ ...task, subjectId, status: "OnHold" }, ...cell]);
    setCell(subjectId, "OnHold", next);
    // 元のセルから削除
    tasks = tasks.filter((t) => !(t.id === task.id && t.status !== "OnHold"));
  }

  function normalizeInProConflicts() {
    const inProTasks = tasks.filter((task) => task.status === "InPro");
    if (inProTasks.length <= 1) {
      return { moved: [] };
    }

    const moved = [];
    const onHoldMap = new Map();

    // 競合タスクを発見順に OnHold の先頭へ積む
    for (const task of inProTasks) {
      tasks = tasks.filter((t) => t.id !== task.id);
      const subjectId = task.subjectId;
      const cell = onHoldMap.get(subjectId) ?? getTasksByCell(subjectId, "OnHold");
      const nextCell = [{ ...task, status: "OnHold" }, ...cell];
      onHoldMap.set(subjectId, nextCell);
      moved.push(task.id);
    }

    for (const [subjectId, cell] of onHoldMap.entries()) {
      setCell(subjectId, "OnHold", normalizeCell(cell));
    }

    return { moved };
  }

  function placeTask(task, to) {
    // remove from current cell
    tasks = tasks.filter((t) => t.id !== task.id);
    const cell = getTasksByCell(to.subjectId, to.status);
    const insertIndex = to.insertIndex ?? cell.length;
    const next = [...cell];
    next.splice(insertIndex, 0, { ...task, subjectId: to.subjectId, status: to.status });
    const normalized = normalizeCell(next);
    setCell(to.subjectId, to.status, normalized);
    return getTask(task.id);
  }

  function moveTask({ taskId, to }) {
    const task = getTask(taskId);
    if (!task) return { ok: false, reason: "not-found" };

    const decision = policy.validateMove({
      taskId,
      from: { subjectId: task.subjectId, status: task.status, priority: task.priority },
      to,
      context: buildContext(task),
    });
    if (!decision.allowed) return { ok: false, reason: decision.reason };

    applySideEffects(decision.sideEffects);
    placeTask(task, to);
    return { ok: true };
  }

  function previewMove({ taskId, to }) {
    const task = getTask(taskId);
    if (!task) return { allowed: false, reason: "not-found" };
    return policy.validateMove({
      taskId,
      from: { subjectId: task.subjectId, status: task.status, priority: task.priority },
      to,
      context: buildContext(task),
    });
  }

  return {
    addTask,
    getTask,
    getTasksByCell,
    moveTask,
    previewMove,
    normalizeInProConflicts,
  };
}
