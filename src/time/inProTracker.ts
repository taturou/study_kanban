const MINUTE_MS = 60 * 1000;

type FlushPayload = { taskId: string; minutes: number } | null;

export function createInProAutoTracker({
  now = () => new Date(),
  flushIntervalMinutes = 5,
}: {
  now?: () => Date;
  flushIntervalMinutes?: number;
} = {}) {
  let activeTaskId: string | null = null;
  let lastTickAt: Date | null = null;
  let lastFlushAt: Date | null = null;
  let pendingMinutes = 0;
  let sessionMinutes = 0;

  function resetSession() {
    activeTaskId = null;
    lastTickAt = null;
    lastFlushAt = null;
    pendingMinutes = 0;
    sessionMinutes = 0;
  }

  function start(taskId: string) {
    activeTaskId = taskId;
    const nowAt = now();
    lastTickAt = nowAt;
    lastFlushAt = nowAt;
    pendingMinutes = 0;
    sessionMinutes = 0;
  }

  function setActiveTask(taskId: string | null) {
    if (!taskId) {
      return stop();
    }
    if (activeTaskId === taskId) return null;
    const flushed = stop();
    start(taskId);
    return flushed;
  }

  function tick(): FlushPayload {
    if (!activeTaskId || !lastTickAt) return null;
    const nowAt = now();
    const elapsedMs = nowAt.getTime() - lastTickAt.getTime();
    if (elapsedMs < MINUTE_MS) return null;

    const minutes = Math.floor(elapsedMs / MINUTE_MS);
    lastTickAt = new Date(lastTickAt.getTime() + minutes * MINUTE_MS);
    pendingMinutes += minutes;
    sessionMinutes += minutes;

    const sinceFlushMs = nowAt.getTime() - (lastFlushAt?.getTime() ?? nowAt.getTime());
    if (pendingMinutes > 0 && sinceFlushMs >= flushIntervalMinutes * MINUTE_MS) {
      const payload = { taskId: activeTaskId, minutes: pendingMinutes };
      pendingMinutes = 0;
      lastFlushAt = nowAt;
      return payload;
    }
    return null;
  }

  function stop(): FlushPayload {
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
