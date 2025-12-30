import type { Status, Task } from "../domain/types";
import type { CalendarEvent } from "../calendar/types";
import { eachDayOfInterval, endOfWeek, startOfWeek } from "date-fns";
import { PRIORITY_STEP } from "../store/taskStore";

export const MASSIVE_SEED_QUERY = "massive";
export const MASSIVE_SPRINT_START = "2025-12-22";

type TaskSeedDefinition = {
  key: string;
  subjectIndex: number;
  status: Status;
  estimateMinutes: number;
  dueOffset?: number;
  updatedOffset?: number;
  actuals?: Array<{ offset: number; minutes: number }>;
};

const MASSIVE_TASK_DEFINITIONS: TaskSeedDefinition[] = [
  {
    key: "mon-done",
    subjectIndex: 0,
    status: "Done",
    estimateMinutes: 120,
    dueOffset: 0,
    updatedOffset: 0,
    actuals: [
      { offset: 0, minutes: 30 },
      { offset: 0, minutes: 30 },
    ],
  },
  {
    key: "mon-backlog",
    subjectIndex: 1,
    status: "Backlog",
    estimateMinutes: 60,
    dueOffset: 0,
  },
  {
    key: "mon-today-heavy",
    subjectIndex: 2,
    status: "Today",
    estimateMinutes: 180,
    dueOffset: 0,
  },
  {
    key: "tue-inpro",
    subjectIndex: 3,
    status: "InPro",
    estimateMinutes: 90,
    dueOffset: 1,
    actuals: [
      { offset: 1, minutes: 60 },
      { offset: 1, minutes: 60 },
    ],
  },
  {
    key: "tue-backlog",
    subjectIndex: 4,
    status: "Backlog",
    estimateMinutes: 45,
    dueOffset: 1,
  },
  {
    key: "wed-onhold",
    subjectIndex: 0,
    status: "OnHold",
    estimateMinutes: 30,
    dueOffset: 2,
    actuals: [
      { offset: 2, minutes: 30 },
      { offset: 2, minutes: 30 },
    ],
  },
  {
    key: "wed-today",
    subjectIndex: 1,
    status: "Today",
    estimateMinutes: 120,
    dueOffset: 2,
  },
  {
    key: "thu-done",
    subjectIndex: 2,
    status: "Done",
    estimateMinutes: 120,
    dueOffset: 3,
    updatedOffset: 3,
    actuals: [
      { offset: 3, minutes: 100 },
      { offset: 3, minutes: 100 },
    ],
  },
  {
    key: "thu-today",
    subjectIndex: 3,
    status: "Today",
    estimateMinutes: 60,
    dueOffset: 3,
  },
  {
    key: "fri-backlog",
    subjectIndex: 4,
    status: "Backlog",
    estimateMinutes: 60,
    dueOffset: 6,
  },
  {
    key: "sat-wontfix",
    subjectIndex: 0,
    status: "WontFix",
    estimateMinutes: 30,
    dueOffset: 5,
  },
  {
    key: "sat-done",
    subjectIndex: 1,
    status: "Done",
    estimateMinutes: 60,
    dueOffset: 5,
    updatedOffset: 5,
    actuals: [
      { offset: 5, minutes: 30 },
      { offset: 5, minutes: 30 },
    ],
  },
  {
    key: "sun-done",
    subjectIndex: 2,
    status: "Done",
    estimateMinutes: 180,
    dueOffset: 4,
    updatedOffset: 4,
    actuals: [
      { offset: 4, minutes: 165 },
      { offset: 4, minutes: 165 },
    ],
  },
  {
    key: "sun-today",
    subjectIndex: 3,
    status: "Today",
    estimateMinutes: 60,
    dueOffset: 4,
  },
  {
    key: "sun-backlog",
    subjectIndex: 4,
    status: "Backlog",
    estimateMinutes: 90,
    dueOffset: 4,
  },
];

const SEED_FALLBACK_SUBJECT = "Seed";
const JST_OFFSET_MINUTES = 9 * 60;

const formatDateKey = (value: Date | string, offsetMinutes = JST_OFFSET_MINUTES) => {
  const date = typeof value === "string" ? new Date(value) : value;
  const shifted = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function isMassiveSeedEnabled(search = isBrowser() ? window.location.search : "") {
  return new URLSearchParams(search).get("seed") === MASSIVE_SEED_QUERY;
}

export function buildMassiveSeedTasks(subjects: string[]): Task[] {
  const start = new Date(`${MASSIVE_SPRINT_START}T00:00:00.000Z`);
  const resolveSubject = (index: number) => subjects[index] ?? subjects[0] ?? SEED_FALLBACK_SUBJECT;
  const toDate = (offset: number) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + offset);
    return day;
  };
  const toIso = (offset: number) => toDate(offset).toISOString();
  const toIsoDate = (offset: number) => formatDateKey(toDate(offset));

  return MASSIVE_TASK_DEFINITIONS.map((definition, index) => {
    const subjectId = resolveSubject(definition.subjectIndex);
    const dueAt = definition.dueOffset !== undefined ? toIso(definition.dueOffset) : undefined;
    const updatedAt =
      definition.updatedOffset !== undefined ? toIso(definition.updatedOffset) : dueAt ?? start.toISOString();
    const createdAt = dueAt ?? start.toISOString();
    const actuals = definition.actuals?.map((actual, actualIndex) => ({
      id: `actual-${definition.key}-${actualIndex}`,
      at: toIsoDate(actual.offset),
      minutes: actual.minutes,
    }));
    const actualMinutes = actuals?.reduce((sum, actual) => sum + actual.minutes, 0);

    return {
      id: `seed-${definition.key}`,
      title: `${subjectId} ${definition.status} ${definition.key}`,
      subjectId,
      status: definition.status,
      priority: PRIORITY_STEP * (MASSIVE_TASK_DEFINITIONS.length - index),
      estimateMinutes: definition.estimateMinutes,
      actualMinutes,
      dueAt,
      createdAt,
      updatedAt,
      actuals: actuals?.length ? actuals : undefined,
    };
  });
}

export function buildMassiveSeedEvents(baseDate: Date): CalendarEvent[] {
  const start = new Date(baseDate);
  const toUtcIso = (offset: number, hours: number, minutes: number) => {
    const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
    date.setUTCDate(date.getUTCDate() + offset);
    date.setUTCHours(hours, minutes, 0, 0);
    return date.toISOString();
  };

  return [
    { id: "seed-event-mon-1", title: "模試", start: toUtcIso(0, 10, 0), end: toUtcIso(0, 12, 0) },
    { id: "seed-event-tue-1", title: "英語スピーキング", start: toUtcIso(1, 19, 0), end: toUtcIso(1, 20, 0) },
    { id: "seed-event-wed-1", title: "家庭科 実習", start: toUtcIso(2, 17, 0), end: toUtcIso(2, 18, 0) },
    { id: "seed-event-wed-2", title: "部活", start: toUtcIso(2, 18, 30), end: toUtcIso(2, 19, 30) },
    { id: "seed-event-wed-3", title: "塾", start: toUtcIso(2, 20, 0), end: toUtcIso(2, 21, 30) },
    { id: "seed-event-fri-1", title: "面談", start: toUtcIso(4, 16, 0), end: toUtcIso(4, 16, 30) },
    { id: "seed-event-sun-1", title: "映画", start: toUtcIso(6, 14, 0), end: toUtcIso(6, 16, 0) },
  ];
}

export function buildMassiveAvailabilityOverrides(baseDate: Date, defaultMinutes: number) {
  const clamp = (value: number) => Math.max(0, value);
  const randomFor = (seed: string) => {
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i += 1) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    let t = (hash >>> 0) + 0x6d2b79f5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };

  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(weekStart, { weekStartsOn: 1 }),
  });
  const overrides: Record<string, number> = {};
  for (const day of weekDays) {
    const iso = formatDateKey(day);
    const random = randomFor(`massive-${iso}`);
    const delta = (random * 2 - 1) * 60;
    const minutes = Math.round((defaultMinutes + delta) / 30) * 30;
    overrides[iso] = clamp(minutes);
  }
  overrides["2025-12-22"] = 420;
  overrides["2025-12-23"] = 150;
  overrides["2025-12-24"] = 90;
  overrides["2025-12-25"] = 240;
  overrides["2025-12-26"] = 360;
  return overrides;
}
