import { STATUS_ORDER } from "../kanban/layout.js";

export const STATUS_LOCKED_ERROR = "固定ステータスのみ変更できます";
export const VERSION_FIELD = "version";

const defaultLabels = Object.fromEntries(STATUS_ORDER.map((s) => [s, s]));

export function createSettingsStore(initial = {}) {
  let statusLabels = { ...defaultLabels, ...(initial.statusLabels ?? {}) };
  let version = initial[VERSION_FIELD] ?? null;

  function assertLocked(status) {
    if (!STATUS_ORDER.includes(status)) {
      throw new Error(STATUS_LOCKED_ERROR);
    }
  }

  return {
    getStatusLabels() {
      return { ...statusLabels };
    },
    setStatusLabel(status, label) {
      assertLocked(status);
      statusLabels = { ...statusLabels, [status]: label };
      return this.getStatusLabels();
    },
    getLockedStatuses() {
      return [...STATUS_ORDER];
    },
    getVersion() {
      return version;
    },
    setVersion(v) {
      version = v;
      return version;
    },
    toJSON() {
      return {
        statusLabels,
        [VERSION_FIELD]: version,
      };
    },
  };
}
