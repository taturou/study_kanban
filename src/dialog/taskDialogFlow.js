import { DIALOG_MODES } from "./taskLauncher.js";

export const tabOrder = ["title", "detail", "dueAt", "estimateMinutes", "actions"];

export function createTaskDialogState({ mode, subjectId, status, task = null }) {
  return {
    mode, // "new" | "edit"
    subjectId,
    status,
    task,
    focus: "title",
  };
}

export function focusNextField(current) {
  const idx = tabOrder.indexOf(current);
  if (idx === -1 || idx === tabOrder.length - 1) return tabOrder[0];
  return tabOrder[idx + 1];
}

export function handleKeyboard(state, event) {
  if (event.ctrlKey && event.key === "Enter") {
    return saveTask(state, {});
  }
  if (event.key === "Escape") {
    return cancelDialog(state);
  }
  return { action: "noop" };
}

export function saveTask(state, updates) {
  const task = {
    ...(state.task ?? {}),
    ...updates,
    subjectId: state.subjectId,
    status: state.status,
  };
  return {
    action: "save",
    task,
    insertPosition: "end",
  };
}

export function cancelDialog() {
  return { action: "cancel" };
}

export function deleteTask(state) {
  if (!state.task?.id) {
    return { action: "noop" };
  }
  return { action: "delete", taskId: state.task.id };
}

export function setDialogMode(currentMode, nextMode) {
  if (!DIALOG_MODES.includes(nextMode)) {
    throw new Error("invalid dialog mode");
  }
  return nextMode;
}
