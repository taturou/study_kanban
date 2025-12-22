import type { Status, Task } from "../domain/types";
import { createStatusPolicy } from "../status/policy";

export const PRIORITY_STEP = 1024;

type MoveTarget = { subjectId: string; status: Status; insertIndex?: number };

function sortByPriority(tasks: Task[]) {
  return [...tasks].sort((a, b) => b.priority - a.priority);
}

function normalizeCell(tasks: Task[]) {
  return tasks.map((task, index) => ({
    ...task,
    priority: PRIORITY_STEP * (tasks.length - index),
  }));
}

export function createTaskStore(policy = createStatusPolicy()) {
  let tasks: Task[] = [];

  function getTask(taskId: string) {
    return tasks.find((t) => t.id === taskId);
  }

  function getTasksByCell(subjectId: string, status: Status) {
    return sortByPriority(tasks.filter((t) => t.subjectId === subjectId && t.status === status));
  }

  function setCell(subjectId: string, status: Status, cellTasks: Task[]) {
    tasks = tasks.filter((t) => !(t.subjectId === subjectId && t.status === status)).concat(cellTasks);
  }

  function addTask(task: Task) {
    const priority = typeof task.priority === "number" ? task.priority : PRIORITY_STEP;
    tasks.push({ ...task, priority });
    return getTask(task.id);
  }

  function updateTask(taskId: string, updates: Partial<Task>) {
    const target = getTask(taskId);
    if (!target) return null;
    tasks = tasks.map((task) => (task.id === taskId ? { ...task, ...updates, priority: task.priority } : task));
    return getTask(taskId);
  }

  function deleteTask(taskId: string) {
    const before = tasks.length;
    tasks = tasks.filter((task) => task.id !== taskId);
    return tasks.length !== before;
  }

  function listTasks() {
    return tasks.map((task) => ({ ...task }));
  }

  function buildContext(task: Task) {
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

  function applySideEffects(effects: Array<{ kind: string; taskId?: string; subjectId?: string; status?: Status }>) {
    for (const effect of effects ?? []) {
      if (effect.kind === "autoMoveToOnHold" && effect.taskId) {
        const target = getTask(effect.taskId);
        if (!target) continue;
        placeTaskOnHoldTop(target, effect.subjectId);
      }
      if (effect.kind === "normalizePriorities" && effect.subjectId && effect.status) {
        const cell = getTasksByCell(effect.subjectId, effect.status);
        setCell(effect.subjectId, effect.status, normalizeCell(cell));
      }
    }
  }

  function placeTaskOnHoldTop(task: Task, subjectOverride?: string) {
    const subjectId = subjectOverride ?? task.subjectId;
    const cell = getTasksByCell(subjectId, "OnHold").filter((t) => t.id !== task.id);
    const next = normalizeCell([{ ...task, subjectId, status: "OnHold" }, ...cell]);
    setCell(subjectId, "OnHold", next);
    tasks = tasks.filter((t) => !(t.id === task.id && t.status !== "OnHold"));
  }

  function normalizeInProConflicts() {
    const inProTasks = tasks.filter((task) => task.status === "InPro");
    if (inProTasks.length <= 1) {
      return { moved: [] as string[] };
    }

    const moved: string[] = [];
    const onHoldMap = new Map<string, Task[]>();

    for (const task of inProTasks) {
      tasks = tasks.filter((t) => t.id !== task.id);
      const subjectId = task.subjectId;
      const cell = onHoldMap.get(subjectId) ?? getTasksByCell(subjectId, "OnHold");
      const nextCell: Task[] = [{ ...task, status: "OnHold" as const }, ...cell];
      onHoldMap.set(subjectId, nextCell);
      moved.push(task.id);
    }

    for (const [subjectId, cell] of onHoldMap.entries()) {
      setCell(subjectId, "OnHold", normalizeCell(cell));
    }

    return { moved };
  }

  function placeTask(task: Task, to: MoveTarget) {
    tasks = tasks.filter((t) => t.id !== task.id);
    const cell = getTasksByCell(to.subjectId, to.status);
    const insertIndex = to.insertIndex ?? cell.length;
    const next = [...cell];
    next.splice(insertIndex, 0, { ...task, subjectId: to.subjectId, status: to.status });
    const normalized = normalizeCell(next);
    setCell(to.subjectId, to.status, normalized);
    return getTask(task.id);
  }

  function moveTask({ taskId, to }: { taskId: string; to: MoveTarget }) {
    const task = getTask(taskId);
    if (!task) return { ok: false, reason: "not-found" as const };

    const decision = policy.validateMove({
      taskId,
      from: { subjectId: task.subjectId, status: task.status, priority: task.priority },
      to,
      context: buildContext(task),
    });
    if (!decision.allowed) return { ok: false, reason: decision.reason };

    applySideEffects(decision.sideEffects);
    placeTask(task, to);
    return { ok: true as const };
  }

  function previewMove({ taskId, to }: { taskId: string; to: MoveTarget }) {
    const task = getTask(taskId);
    if (!task) return { allowed: false, reason: "not-found" as const };
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
    updateTask,
    deleteTask,
    listTasks,
  };
}
