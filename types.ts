export enum TaskStatus {
  TOMORROW_PLUS = 'tomorrow_plus',
  TODAY = 'today',
  STUDYING = 'studying',
  HOLD = 'hold',
  DONE = 'done',
  WONT_DO = 'wont_do',
}

export type Priority = 'High' | 'Medium' | 'Low';

export interface Subject {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  subjectId: string;
  status: TaskStatus;
  title: string;
  description?: string;
  estimatedMinutes: number;
  actualMinutes: number;
  priority: Priority;
  deadline?: number; // timestamp
  createdAt: number;
}

export interface Reminder {
  id: string;
  time: string; // HH:MM format
  days: number[]; // 0=Sun, 1=Mon, ...
  message: string;
  enabled: boolean;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.TOMORROW_PLUS]: '明日以降',
  [TaskStatus.TODAY]: '今日やる',
  [TaskStatus.STUDYING]: '勉強中',
  [TaskStatus.HOLD]: '保留',
  [TaskStatus.DONE]: '終わった',
  [TaskStatus.WONT_DO]: 'やらない',
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.TOMORROW_PLUS]: 'bg-slate-100 border-slate-200 text-slate-600',
  [TaskStatus.TODAY]: 'bg-blue-50 border-blue-200 text-blue-700',
  [TaskStatus.STUDYING]: 'bg-purple-50 border-purple-200 text-purple-700',
  [TaskStatus.HOLD]: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  [TaskStatus.DONE]: 'bg-green-50 border-green-200 text-green-700',
  [TaskStatus.WONT_DO]: 'bg-red-50 border-red-200 text-red-700',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  High: '高',
  Medium: '中',
  Low: '低',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  High: 'bg-red-100 text-red-700 border-red-200',
  Medium: 'bg-orange-100 text-orange-700 border-orange-200',
  Low: 'bg-slate-100 text-slate-600 border-slate-200',
};