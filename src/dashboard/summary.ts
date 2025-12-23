import type { Status, Task } from "../domain/types";
import { STATUS_ORDER } from "../status/policy";

type SprintRange = { start: Date; end: Date };

export type BurndownEntry = {
  date: string;
  remainingCount: number;
  remainingMinutes: number;
};

export type DashboardSummary = {
  statusCounts: Record<string, Record<Status, number>>;
  doneBySubject: Record<string, number>;
  minutesBySubject: Record<string, number>;
  burndown: BurndownEntry[];
};

type BuildInput = {
  tasks: Task[];
  subjects: string[];
  sprintRange: SprintRange;
  statusOrder?: Status[];
};

const isoDate = (value: Date | string) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
};

function isWithinRange(value: string | undefined, range: SprintRange) {
  if (!value) return false;
  const date = isoDate(value);
  return date >= isoDate(range.start) && date <= isoDate(range.end);
}

function isDoneByDate(task: Task, date: Date) {
  if (task.status !== "Done") return false;
  if (!task.updatedAt) return false;
  return isoDate(task.updatedAt) <= isoDate(date);
}

function buildBurndownSeries(tasks: Task[], sprintRange: SprintRange): BurndownEntry[] {
  const days: BurndownEntry[] = [];
  const current = new Date(sprintRange.start);
  while (current <= sprintRange.end) {
    const remaining = tasks.filter((task) => !isDoneByDate(task, current));
    const remainingMinutes = remaining.reduce((sum, task) => sum + (task.estimateMinutes ?? 0), 0);
    days.push({
      date: isoDate(current),
      remainingCount: remaining.length,
      remainingMinutes,
    });
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return days;
}

export function buildDashboardSummary({ tasks, subjects, sprintRange, statusOrder = STATUS_ORDER }: BuildInput) {
  const statusCounts: Record<string, Record<Status, number>> = {};
  const doneBySubject: Record<string, number> = {};
  const minutesBySubject: Record<string, number> = {};

  subjects.forEach((subject) => {
    statusCounts[subject] = statusOrder.reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<Status, number>,
    );
    doneBySubject[subject] = 0;
    minutesBySubject[subject] = 0;
  });

  tasks.forEach((task) => {
    if (!statusCounts[task.subjectId]) {
      statusCounts[task.subjectId] = statusOrder.reduce(
        (acc, status) => {
          acc[status] = 0;
          return acc;
        },
        {} as Record<Status, number>,
      );
      doneBySubject[task.subjectId] = 0;
      minutesBySubject[task.subjectId] = 0;
    }
    statusCounts[task.subjectId][task.status] += 1;

    if (task.status === "Done" && isWithinRange(task.updatedAt, sprintRange)) {
      doneBySubject[task.subjectId] += 1;
      const minutes = (task.actuals ?? []).reduce((sum, actual) => sum + (actual.minutes ?? 0), 0);
      minutesBySubject[task.subjectId] += minutes;
    }
  });

  return {
    statusCounts,
    doneBySubject,
    minutesBySubject,
    burndown: buildBurndownSeries(tasks, sprintRange),
  } satisfies DashboardSummary;
}
