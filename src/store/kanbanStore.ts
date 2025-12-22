import { create } from "zustand";
import { createKanbanController } from "../kanban/controller";
import type { Status, Task } from "../domain/types";

const DEFAULT_SUBJECTS = ["国語", "数学", "英語", "理科", "社会", "技術", "音楽", "体育", "家庭科"];

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

const controller = createKanbanController({ subjects: DEFAULT_SUBJECTS });

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
};

export const useKanbanStore = create<KanbanStore>((set) => ({
  ...buildSnapshot(),
  openNewTaskDialog: (subjectId, status) => {
    controller.openNewTaskDialog({ subjectId, status });
    set(buildSnapshot());
  },
  openEditTaskDialog: (taskId) => {
    controller.openEditTaskDialog(taskId);
    set(buildSnapshot());
  },
  closeDialog: () => {
    controller.closeDialog();
    set(buildSnapshot());
  },
  saveDialog: (updates) => {
    controller.saveDialog(updates);
    set(buildSnapshot());
  },
  deleteDialogTask: () => {
    controller.deleteDialogTask();
    set(buildSnapshot());
  },
  moveTask: (taskId, to) => {
    controller.moveTask({ taskId, to });
    set(buildSnapshot());
  },
  previewMove: (taskId, to) => controller.previewMove({ taskId, to }),
  updateStatusLabel: (status, label) => {
    controller.updateStatusLabel(status, label);
    set(buildSnapshot());
  },
  tickTimers: () => {
    if (controller.tickTimers()) {
      set(buildSnapshot());
    }
  },
}));
