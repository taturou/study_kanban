import type { Status, Task } from "../domain/types";
import { DIALOG_MODES } from "./taskLauncher";

export const tabOrder = ["title", "detail", "dueAt", "estimateMinutes", "actions"] as const;

type DialogFocus = (typeof tabOrder)[number];
type DialogMode = "new" | "edit";

export type TaskDialogState = {
  mode: DialogMode;
  subjectId: string;
  status: Status;
  task: Task | null;
  focus: DialogFocus;
};

export function createTaskDialogState({
  mode,
  subjectId,
  status,
  task = null,
}: {
  mode: DialogMode;
  subjectId: string;
  status: Status;
  task?: Task | null;
}) {
  return {
    mode,
    subjectId,
    status,
    task,
    focus: "title" as DialogFocus,
  };
}

export function focusNextField(current: DialogFocus) {
  const idx = tabOrder.indexOf(current);
  if (idx === -1 || idx === tabOrder.length - 1) return tabOrder[0];
  return tabOrder[idx + 1];
}

export function handleKeyboard(state: TaskDialogState, event: { ctrlKey: boolean; key: string }) {
  if (event.ctrlKey && event.key === "Enter") {
    return saveTask(state, {});
  }
  if (event.key === "Escape") {
    return cancelDialog();
  }
  return { action: "noop" as const };
}

export function saveTask(state: TaskDialogState, updates: Partial<Task>) {
  const task = {
    ...(state.task ?? {}),
    ...updates,
    subjectId: state.subjectId,
    status: state.status,
  };
  return {
    action: "save" as const,
    task,
    insertPosition: "end" as const,
  };
}

export function cancelDialog() {
  return { action: "cancel" as const };
}

export function deleteTask(state: TaskDialogState) {
  if (!state.task?.id) {
    return { action: "noop" as const };
  }
  return { action: "delete" as const, taskId: state.task.id };
}

export function setDialogMode(
  currentMode: (typeof DIALOG_MODES)[number],
  nextMode: (typeof DIALOG_MODES)[number],
) {
  if (!DIALOG_MODES.includes(nextMode)) {
    throw new Error("invalid dialog mode");
  }
  return nextMode;
}
