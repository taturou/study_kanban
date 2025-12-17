import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { STATUS_ORDER } from "../src/kanban/layout.js";
import {
  createSettingsStore,
  STATUS_LOCKED_ERROR,
  VERSION_FIELD,
} from "../src/settings/store.js";

let store;

beforeEach(() => {
  store = createSettingsStore();
});

test("固定ステータスの表示名を取得・更新できるが、未知ステータスは拒否する", () => {
  const labels = store.getStatusLabels();
  assert.equal(Object.keys(labels).length, STATUS_ORDER.length);
  assert.equal(labels.Backlog, "Backlog");

  store.setStatusLabel("Backlog", "未着手");
  assert.equal(store.getStatusLabels().Backlog, "未着手");

  assert.throws(() => store.setStatusLabel("Unknown", "x"), {
    message: STATUS_LOCKED_ERROR,
  });
});

test("固定ステータス一覧は STATUS_ORDER と一致し、追加/削除はできない", () => {
  assert.deepEqual(store.getLockedStatuses(), STATUS_ORDER);
  assert.throws(() => store.setStatusLabel("Extra", "追加不可"), {
    message: STATUS_LOCKED_ERROR,
  });
});

test("アプリバージョンは settings 経由で保持・取得できる", () => {
  assert.equal(store.getVersion(), null);
  store.setVersion("1.2.3");
  assert.equal(store.getVersion(), "1.2.3");
  assert.equal(store.toJSON()[VERSION_FIELD], "1.2.3");
});
