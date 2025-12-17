export const DIALOG_MODES = ["individual", "bulk"];
export const DEFAULT_DIALOG_MODE = "individual";

export function createTaskDialogState({ subjectId, status }) {
  return {
    subjectId,
    status,
    mode: DEFAULT_DIALOG_MODE,
  };
}

export function toggleDialogMode(state, nextMode) {
  if (!DIALOG_MODES.includes(nextMode)) {
    throw new Error("invalid dialog mode");
  }
  return { ...state, mode: nextMode };
}
