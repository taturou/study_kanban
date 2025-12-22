import type { Status, Task } from "../domain/types";

export function sumActualMinutes(task?: Task | null) {
  if (!task) return 0;
  if (Array.isArray(task.actuals)) {
    return task.actuals.reduce((sum, actual) => sum + (actual.minutes ?? 0), 0);
  }
  return task.actualMinutes ?? 0;
}

export function computeRemainingMinutes(task: Task, { inProExtraMinutes = 0 }: { inProExtraMinutes?: number } = {}) {
  const estimate = task?.estimateMinutes ?? 0;
  const actual = sumActualMinutes(task) + inProExtraMinutes;
  return Math.max(estimate - actual, 0);
}

export function summarizeLoad({
  tasks = [],
  availableMinutes = 0,
  statuses = ["Today", "InPro", "OnHold"],
  inProExtraMinutesByTaskId = {},
}: {
  tasks?: Task[];
  availableMinutes?: number;
  statuses?: Status[];
  inProExtraMinutesByTaskId?: Record<string, number>;
} = {}) {
  const remainingMinutes = tasks
    .filter((task) => statuses.includes(task.status))
    .reduce((sum, task) => {
      const extra = inProExtraMinutesByTaskId[task.id] ?? 0;
      return sum + computeRemainingMinutes(task, { inProExtraMinutes: extra });
    }, 0);

  const remainingAvailableMinutes = Math.max(availableMinutes - remainingMinutes, 0);
  const overload = remainingMinutes > availableMinutes;
  const ratio = availableMinutes > 0 ? remainingAvailableMinutes / availableMinutes : 0;

  return {
    remainingMinutes,
    availableMinutes,
    remainingAvailableMinutes,
    overload,
    ratio,
  };
}
