/**
 * DnD ヘルパー: TaskStore を使ってドロップ可否とハイライト情報を判定する。
 * UI からは previewMove を呼び出して、許可時のみハイライトする想定。
 */
export function getDropFeedback(store, { taskId, to }) {
  const decision = store.previewMove({ taskId, to });
  return {
    highlight: decision.allowed,
    reason: decision.allowed ? null : decision.reason,
  };
}

export function applyDrop(store, { taskId, to }) {
  return store.moveTask({ taskId, to });
}

/**
 * 同一セルの並び替えで、自分より後ろにドロップする場合は実挿入位置を1つ前に補正する。
 */
export function computeInsertIndex({ targetIndex, dragMeta, containerLength, isSameCell }) {
  if (targetIndex === undefined || targetIndex === null) return containerLength;
  if (!dragMeta) return targetIndex;
  if (isSameCell && targetIndex > dragMeta.index) {
    return Math.max(0, targetIndex - 1);
  }
  return targetIndex;
}
