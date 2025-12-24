import { create } from "zustand";
import { createKanbanController } from "../kanban/controller";
import { PRIORITY_STEP } from "./taskStore";
import type { Status, Task } from "../domain/types";

const DEFAULT_SUBJECTS = ["国語", "数学", "英語", "理科", "社会", "技術", "音楽", "体育", "家庭科"];
const DEBUG_SUBJECTS = [...DEFAULT_SUBJECTS, "地理", "歴史", "公民", "物理", "化学"];
const DEBUG_STATUSES: Status[] = ["Backlog", "Today", "InPro", "OnHold", "Done", "WontFix"];
const DEBUG_SPRINT_START = "2025-12-22";
const DEBUG_CELL_COUNT = 35;

function buildDebugTasks(subjects: string[]) {
  const tasks: Task[] = [];
  const start = new Date(`${DEBUG_SPRINT_START}T00:00:00.000Z`);

  subjects.forEach((subject, subjectIndex) => {
    DEBUG_STATUSES.forEach((status, statusIndex) => {
      for (let i = 0; i < DEBUG_CELL_COUNT; i += 1) {
        if (status === "InPro" && !(subjectIndex === 0 && i === 0)) {
          continue;
        }
        const dayOffset = (subjectIndex + statusIndex + i) % 7;
        const dueAt = new Date(start);
        dueAt.setUTCDate(start.getUTCDate() + dayOffset);
        const createdAt = new Date(start);
        createdAt.setUTCDate(start.getUTCDate() + ((subjectIndex + i) % 7));
        const estimateMinutes = 20 + ((subjectIndex + statusIndex + i) % 6) * 10;
        const actualMinutes = Math.max(5, estimateMinutes - ((i + statusIndex) % 3) * 5);
        const actuals =
          status === "Done" || status === "InPro" || status === "OnHold"
            ? [
                {
                  id: `actual-${subjectIndex}-${statusIndex}-${i}-a`,
                  at: dueAt.toISOString().slice(0, 10),
                  minutes: Math.max(5, Math.floor(actualMinutes * 0.6)),
                },
                {
                  id: `actual-${subjectIndex}-${statusIndex}-${i}-b`,
                  at: dueAt.toISOString().slice(0, 10),
                  minutes: Math.max(5, actualMinutes - Math.floor(actualMinutes * 0.6)),
                },
              ]
            : [];

        tasks.push({
          id: `seed-${subjectIndex}-${statusIndex}-${i}`,
          title: `${subject} ${status} ${String(i + 1).padStart(2, "0")}`,
          subjectId: subject,
          status,
          priority: PRIORITY_STEP * (DEBUG_CELL_COUNT - i),
          estimateMinutes,
          actualMinutes: actuals.reduce((sum, actual) => sum + actual.minutes, 0),
          dueAt: dueAt.toISOString(),
          createdAt: createdAt.toISOString(),
          updatedAt: dueAt.toISOString(),
          actuals: actuals.length ? actuals : undefined,
        });
      }
    });
  });

  return tasks;
}

type KanbanSnapshot = {
  subjects: string[];
  tasks: Task[];
  statusLabels: Record<Status, string>;
  sprintLabel: string;
  dialogState: ReturnType<typeof controller.getDialogState>;
  availability: ReturnType<typeof controller.getAvailabilitySummary>;
  pomodoro: ReturnType<typeof controller.getPomodoroSnapshot>;
  alerts: Array<{ type: string }>;
};

const seedEnabled =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("seed") === "massive";
const seedSubjects = seedEnabled ? DEBUG_SUBJECTS : DEFAULT_SUBJECTS;
const seedTasks = seedEnabled ? buildDebugTasks(seedSubjects) : [];
const seedNow = seedEnabled ? new Date(`${DEBUG_SPRINT_START}T00:00:00.000Z`) : new Date();
const controller = createKanbanController({ subjects: seedSubjects, now: seedNow, tasks: seedTasks });

function buildSnapshot(): KanbanSnapshot {
  return {
    subjects: controller.getSubjects(),
    tasks: controller.listTasks(),
    statusLabels: controller.getStatusLabels(),
    sprintLabel: controller.getSprintLabel(),
    dialogState: controller.getDialogState(),
    availability: controller.getAvailabilitySummary(),
    pomodoro: controller.getPomodoroSnapshot(),
    alerts: controller.consumeAlerts(),
  };
}

type KanbanStore = KanbanSnapshot & {
  pomodoroVisible: boolean;
  setPomodoroVisible: (visible: boolean) => void;
  openNewTaskDialog: (subjectId: string, status: Status) => void;
  openEditTaskDialog: (taskId: string) => void;
  closeDialog: () => void;
  saveDialog: (updates: Partial<Task>) => void;
  deleteDialogTask: () => void;
  moveTask: (taskId: string, to: { subjectId: string; status: Status; insertIndex?: number }) => void;
  previewMove: (taskId: string, to: { subjectId: string; status: Status; insertIndex?: number }) => {
    allowed: boolean;
    reason?: string;
  };
  updateStatusLabel: (status: Status, label: string) => void;
  tickTimers: () => void;
  triggerPomodoro: (action: "start" | "pause" | "reset") => void;
};

export const useKanbanStore = create<KanbanStore>((set) => {
  const refresh = () => set((state) => ({ ...state, ...buildSnapshot() }));
  return {
  ...buildSnapshot(),
  pomodoroVisible: false,
  setPomodoroVisible: (visible) => {
    set({ pomodoroVisible: visible });
    refresh();
  },
  openNewTaskDialog: (subjectId, status) => {
    controller.openNewTaskDialog({ subjectId, status });
    refresh();
  },
  openEditTaskDialog: (taskId) => {
    controller.openEditTaskDialog(taskId);
    refresh();
  },
  closeDialog: () => {
    controller.closeDialog();
    refresh();
  },
  saveDialog: (updates) => {
    controller.saveDialog(updates);
    refresh();
  },
  deleteDialogTask: () => {
    controller.deleteDialogTask();
    refresh();
  },
  moveTask: (taskId, to) => {
    controller.moveTask({ taskId, to });
    refresh();
  },
  previewMove: (taskId, to) => controller.previewMove({ taskId, to }),
  updateStatusLabel: (status, label) => {
    controller.updateStatusLabel(status, label);
    refresh();
  },
  triggerPomodoro: (action) => {
    controller.triggerPomodoro(action);
    refresh();
  },
  tickTimers: () => {
    if (controller.tickTimers()) {
      refresh();
    }
  },
  };
});
