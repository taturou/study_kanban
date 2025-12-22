import type { TaskActual } from "../domain/types";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function normalizeEntry(entry: TaskActual) {
  return {
    id: entry.id ?? generateId(),
    at: entry.at,
    minutes: entry.minutes,
  };
}

export function createActualsState(initial: TaskActual[] = []) {
  const items = initial.map(normalizeEntry);
  return {
    items,
    totalMinutes: items.reduce((sum, item) => sum + item.minutes, 0),
  };
}

export function addActual(state: { items: TaskActual[] }, entry: TaskActual) {
  const nextItems = [...state.items, normalizeEntry(entry)];
  return createActualsState(nextItems);
}

export function updateActual(state: { items: TaskActual[] }, entry: TaskActual) {
  const nextItems = state.items.map((item) => (item.id === entry.id ? { ...item, ...entry } : item));
  return createActualsState(nextItems);
}

export function deleteActual(state: { items: TaskActual[] }, id: string) {
  const nextItems = state.items.filter((item) => item.id !== id);
  return createActualsState(nextItems);
}
