import { create } from "zustand";
import { createKanbanController } from "../kanban/controller";
import { buildMassiveSeedTasks, isMassiveSeedEnabled, MASSIVE_SPRINT_START } from "../seed/massiveSeed";
import type { Status, Task } from "../domain/types";

const DEFAULT_SUBJECTS = ["国語", "数学", "英語", "理科", "社会", "技術", "音楽", "体育", "家庭科"];
const DEBUG_SUBJECTS = [...DEFAULT_SUBJECTS, "地理", "歴史", "公民", "物理", "化学"];

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

const seedEnabled = isMassiveSeedEnabled();
const seedSubjects = seedEnabled ? DEBUG_SUBJECTS : DEFAULT_SUBJECTS;
const seedTasks = seedEnabled ? buildMassiveSeedTasks(seedSubjects) : [];
const seedNow = seedEnabled ? new Date(`${MASSIVE_SPRINT_START}T00:00:00.000Z`) : new Date();
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
