import type { Status, Task } from "../domain/types";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function isSquareCard(status: Status) {
  return status === "InPro";
}

export function buildCardViewModel(task: Task) {
  const due = task.dueAt ? new Date(task.dueAt) : null;
  const dueWeekday = due ? WEEKDAYS[due.getUTCDay()] : "";
  return {
    id: task.id,
    title: task.title,
    dueWeekday,
    gauge: {
      estimate: task.estimateMinutes ?? 0,
      actual: task.actualMinutes ?? 0,
    },
    shape: isSquareCard(task.status) ? "square" : "rect",
  };
}
