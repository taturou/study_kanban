import type { Status } from "../domain/types";

export const DIALOG_MODES = ["individual", "bulk"] as const;
export const DEFAULT_DIALOG_MODE = "individual";

export type TaskDialogLauncherState = {
  subjectId: string;
  status: Status;
  mode: (typeof DIALOG_MODES)[number];
};

export function createTaskDialogState({ subjectId, status }: { subjectId: string; status: Status }): TaskDialogLauncherState {
  return {
    subjectId,
    status,
    mode: DEFAULT_DIALOG_MODE,
  };
}

export function toggleDialogMode(state: TaskDialogLauncherState, nextMode: (typeof DIALOG_MODES)[number]) {
  if (!DIALOG_MODES.includes(nextMode)) {
    throw new Error("invalid dialog mode");
  }
  return { ...state, mode: nextMode };
}
