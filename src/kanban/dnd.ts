import type { Status } from "../domain/types";

type PreviewInput = {
  taskId: string;
  to: { subjectId: string; status: Status; insertIndex?: number };
};

type PreviewStore = {
  previewMove: (input: PreviewInput) => { allowed: boolean; reason?: string };
};

export function getDropFeedback(store: PreviewStore, { taskId, to }: PreviewInput) {
  const decision = store.previewMove({ taskId, to });
  return {
    highlight: decision.allowed,
    reason: decision.allowed ? null : decision.reason ?? null,
  };
}

type MoveStore = {
  moveTask: (input: { taskId: string; to: { subjectId: string; status: Status; insertIndex?: number } }) => {
    ok: boolean;
    reason?: string;
  };
};

export function applyDrop(store: MoveStore, { taskId, to }: PreviewInput) {
  return store.moveTask({ taskId, to });
}

export function computeInsertIndex({
  targetIndex,
  dragMeta,
  containerLength,
  isSameCell,
}: {
  targetIndex?: number | null;
  dragMeta?: { index: number } | null;
  containerLength: number;
  isSameCell: boolean;
}) {
  if (targetIndex === undefined || targetIndex === null) return containerLength;
  if (!dragMeta) return targetIndex;
  if (isSameCell && targetIndex > dragMeta.index) {
    return Math.max(0, targetIndex - 1);
  }
  return targetIndex;
}
