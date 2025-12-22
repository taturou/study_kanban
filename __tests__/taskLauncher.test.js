import assert from "node:assert/strict";
import { test, beforeEach } from "vitest";
import {
  createTaskDialogState,
  toggleDialogMode,
  DEFAULT_DIALOG_MODE,
} from "../src/dialog/taskLauncher";

let state;

beforeEach(() => {
  state = createTaskDialogState({
    subjectId: "English",
    status: "Backlog",
  });
});

test("Backlog プラスから起動すると教科がプリセットされ、個別モードがデフォルト", () => {
  assert.equal(state.subjectId, "English");
  assert.equal(state.status, "Backlog");
  assert.equal(state.mode, DEFAULT_DIALOG_MODE);
  assert.equal(state.mode, "individual");
});

test("モードを個別/一括でトグルできる", () => {
  const bulk = toggleDialogMode(state, "bulk");
  assert.equal(bulk.mode, "bulk");
  const individual = toggleDialogMode(bulk, "individual");
  assert.equal(individual.mode, "individual");
});

test("無効なモードは拒否する", () => {
  assert.throws(() => toggleDialogMode(state, "invalid"), /invalid dialog mode/);
});
