import { create } from "zustand";
import { createKanbanController } from "../kanban/controller";
import { computeSprintRange, formatSprintRange } from "../sprint/range";
import { buildMassiveSeedTasks, isMassiveSeedEnabled, MASSIVE_SPRINT_START } from "../seed/massiveSeed";
import type { Status, Task } from "../domain/types";

const DEFAULT_SUBJECTS = ["国語", "数学", "英語", "理科", "社会", "技術", "音楽", "体育", "家庭科"];
const DEBUG_SUBJECTS = [...DEFAULT_SUBJECTS, "地理", "歴史", "公民", "物理", "化学"];
const STORAGE_KEY = "lpk.currentSprintId";

function loadStoredSprintDate() {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  const parsed = new Date(`${stored}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

type KanbanSnapshot = {
  subjects: string[];
  tasks: Task[];
  sprintTasks: Task[];
  statusLabels: Record<Status, string>;
  sprintLabel: string;
  sprintRange: { start: Date; end: Date };
  currentSprintDate: Date;
  dialogState: ReturnType<typeof controller.getDialogState>;
  availability: ReturnType<typeof controller.getAvailabilitySummary>;
  pomodoro: ReturnType<typeof controller.getPomodoroSnapshot>;
  alerts: Array<{ type: string }>;
};

const seedEnabled = isMassiveSeedEnabled();
const seedSubjects = seedEnabled ? DEBUG_SUBJECTS : DEFAULT_SUBJECTS;
const seedTasks = seedEnabled ? buildMassiveSeedTasks(seedSubjects) : [];
const seedNow = seedEnabled ? new Date(`${MASSIVE_SPRINT_START}T00:00:00.000Z`) : new Date();
const initialSprintDate = loadStoredSprintDate() ?? seedNow;
const controller = createKanbanController({ subjects: seedSubjects, now: initialSprintDate, tasks: seedTasks });

const isWithinSprint = (value: string | undefined, range: { start: Date; end: Date }) => {
  if (!value) return true;
  const date = value.slice(0, 10);
  const start = range.start.toISOString().slice(0, 10);
  const end = range.end.toISOString().slice(0, 10);
  return date >= start && date <= end;
};

function buildSnapshot(sprintDate: Date): KanbanSnapshot {
  const sprintRange = computeSprintRange(sprintDate);
  const tasks = controller.listTasks();
  const sprintTasks = tasks.filter((task) => isWithinSprint(task.dueAt, sprintRange));
  return {
    subjects: controller.getSubjects(),
    tasks,
    sprintTasks,
    statusLabels: controller.getStatusLabels(),
    sprintLabel: formatSprintRange(sprintRange),
    sprintRange,
    currentSprintDate: sprintDate,
    dialogState: controller.getDialogState(),
    availability: controller.getAvailabilitySummary(),
    pomodoro: controller.getPomodoroSnapshot(),
    alerts: controller.consumeAlerts(),
  };
}

type KanbanStore = KanbanSnapshot & {
  pomodoroVisible: boolean;
  sprintLabelOverride: string | null;
  setSprintLabelOverride: (label: string | null) => void;
  setCurrentSprintDate: (date: Date) => void;
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
  const refresh = () => set((state) => ({ ...state, ...buildSnapshot(state.currentSprintDate) }));
  return {
  ...buildSnapshot(initialSprintDate),
  pomodoroVisible: false,
  sprintLabelOverride: null,
  setSprintLabelOverride: (label) => {
    set({ sprintLabelOverride: label });
  },
  setCurrentSprintDate: (date) => {
    set((state) => ({ ...state, ...buildSnapshot(date) }));
  },
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
