function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function normalizeEntry(entry) {
  return {
    id: entry.id ?? generateId(),
    at: entry.at,
    minutes: entry.minutes,
  };
}

export function createActualsState(initial = []) {
  const items = initial.map(normalizeEntry);
  return {
    items,
    totalMinutes: items.reduce((sum, item) => sum + item.minutes, 0),
  };
}

export function addActual(state, entry) {
  const nextItems = [...state.items, normalizeEntry(entry)];
  return createActualsState(nextItems);
}

export function updateActual(state, entry) {
  const nextItems = state.items.map((item) =>
    item.id === entry.id ? { ...item, ...entry } : item,
  );
  return createActualsState(nextItems);
}

export function deleteActual(state, id) {
  const nextItems = state.items.filter((item) => item.id !== id);
  return createActualsState(nextItems);
}
