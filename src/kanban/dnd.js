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
