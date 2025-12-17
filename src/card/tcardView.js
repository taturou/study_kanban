const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function isSquareCard(status) {
  return status === "InPro";
}

export function buildCardViewModel(task) {
  const due = new Date(task.dueAt);
  const dueWeekday = WEEKDAYS[due.getUTCDay()];
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
