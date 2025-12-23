import type { Task } from "../domain/types";

type SprintRange = { start: Date; end: Date };

const toIsoDate = (value: Date | string) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
};

export function buildDayViewLists({
  tasks,
  date,
  sprintRange,
}: {
  tasks: Task[];
  date: Date;
  sprintRange: SprintRange;
}) {
  const target = toIsoDate(date);
  const sprintStart = toIsoDate(sprintRange.start);

  const due = tasks.filter((task) => (task.dueAt ? toIsoDate(task.dueAt) === target : false));
  const added = tasks.filter((task) => {
    if (!task.createdAt) return false;
    const created = toIsoDate(task.createdAt);
    return created === target && created >= sprintStart;
  });
  const actual = tasks.filter((task) => (task.actuals ?? []).some((actual) => actual.at === target));
  const overdue = tasks.filter((task) => {
    if (!task.dueAt) return false;
    const dueAt = toIsoDate(task.dueAt);
    return dueAt < target && task.status !== "Done";
  });

  return { due, added, actual, overdue };
}
