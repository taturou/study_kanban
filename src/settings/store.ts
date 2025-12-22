import { STATUS_ORDER } from "../status/policy";
import type { StatusLabels, Status } from "../domain/types";

export const STATUS_LOCKED_ERROR = "固定ステータスのみ変更できます";
export const VERSION_FIELD = "version";

const defaultLabels: StatusLabels = Object.fromEntries(STATUS_ORDER.map((s) => [s, s])) as StatusLabels;

type SettingsSnapshot = {
  statusLabels?: Partial<StatusLabels>;
  [VERSION_FIELD]?: string | null;
};

export function createSettingsStore(initial: SettingsSnapshot = {}) {
  let statusLabels: StatusLabels = { ...defaultLabels, ...(initial.statusLabels ?? {}) };
  let version: string | null = initial[VERSION_FIELD] ?? null;

  function assertLocked(status: Status) {
    if (!STATUS_ORDER.includes(status)) {
      throw new Error(STATUS_LOCKED_ERROR);
    }
  }

  return {
    getStatusLabels() {
      return { ...statusLabels };
    },
    setStatusLabel(status: Status, label: string) {
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
    setVersion(v: string | null) {
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
