export type Status = "Backlog" | "Today" | "InPro" | "OnHold" | "Done" | "WontFix";

export type TaskActual = {
  id: string;
  at: string;
  minutes: number;
};

export type Task = {
  id: string;
  title: string;
  detail?: string;
  subjectId: string;
  status: Status;
  priority: number;
  estimateMinutes?: number;
  actualMinutes?: number;
  dueAt?: string;
  actuals?: TaskActual[];
  inProElapsedMinutes?: number;
  inProPendingMinutes?: number;
};

export type StatusLabels = Record<Status, string>;
