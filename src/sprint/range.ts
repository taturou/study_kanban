const DAY_MS = 24 * 60 * 60 * 1000;

export function computeSprintRange(referenceDate: Date) {
  const date = new Date(referenceDate);
  const day = date.getUTCDay(); // 0: Sun, 1: Mon
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + diffToMonday));
  const end = new Date(start.getTime() + 6 * DAY_MS);
  return { start, end };
}

export function formatSprintRange({ start, end }: { start: Date; end: Date }) {
  const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);
  return `${toIsoDate(start)} 〜 ${toIsoDate(end)}`;
}
