const MINUTE_MS = 60 * 1000;

export function createInProAutoTracker({ now = () => new Date(), flushIntervalMinutes = 5 } = {}) {
  let activeTaskId = null;
  let lastTickAt = null;
  let lastFlushAt = null;
  let pendingMinutes = 0;
  let sessionMinutes = 0;

  function resetSession() {
    activeTaskId = null;
    lastTickAt = null;
    lastFlushAt = null;
    pendingMinutes = 0;
    sessionMinutes = 0;
  }

  function start(taskId) {
    activeTaskId = taskId;
    const nowAt = now();
    lastTickAt = nowAt;
    lastFlushAt = nowAt;
    pendingMinutes = 0;
    sessionMinutes = 0;
  }

  function setActiveTask(taskId) {
    if (!taskId) {
      return stop();
    }
    if (activeTaskId === taskId) return null;
    const flushed = stop();
    start(taskId);
    return flushed;
  }

  function tick() {
    if (!activeTaskId || !lastTickAt) return null;
    const nowAt = now();
    const elapsedMs = nowAt - lastTickAt;
    if (elapsedMs < MINUTE_MS) return null;

    const minutes = Math.floor(elapsedMs / MINUTE_MS);
    lastTickAt = new Date(lastTickAt.getTime() + minutes * MINUTE_MS);
    pendingMinutes += minutes;
    sessionMinutes += minutes;

    const sinceFlushMs = nowAt - lastFlushAt;
    if (pendingMinutes > 0 && sinceFlushMs >= flushIntervalMinutes * MINUTE_MS) {
      const payload = { taskId: activeTaskId, minutes: pendingMinutes };
      pendingMinutes = 0;
      lastFlushAt = nowAt;
      return payload;
    }
    return null;
  }

  function stop() {
    if (!activeTaskId) return null;
    tick();
    if (pendingMinutes <= 0) {
      resetSession();
      return null;
    }
    const payload = { taskId: activeTaskId, minutes: pendingMinutes };
    resetSession();
    return payload;
  }

  return {
    setActiveTask,
    tick,
    stop,
    getActiveTaskId: () => activeTaskId,
    getSessionMinutes: () => sessionMinutes,
    getPendingMinutes: () => pendingMinutes,
  };
}
