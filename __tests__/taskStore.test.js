import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import { createTaskStore } from "../src/store/taskStore.js";

let store;

beforeEach(() => {
  store = createTaskStore();
  // 初期タスクを登録（priority は大きいほど上）
  store.addTask({ id: "t1", title: "Today top", subjectId: "English", status: "Today", priority: 3000 });
  store.addTask({ id: "t2", title: "Today second", subjectId: "English", status: "Today", priority: 2000 });
  store.addTask({ id: "t3", title: "OnHold top", subjectId: "English", status: "OnHold", priority: 1500 });
});

test("Today 先頭のみ InPro へ遷移でき、非先頭は拒否される", () => {
  const fail = store.moveTask({ taskId: "t2", to: { subjectId: "English", status: "InPro", insertIndex: 0 } });
  assert.equal(fail.ok, false);
  assert.match(fail.reason, /today-not-top/);

  const ok = store.moveTask({ taskId: "t1", to: { subjectId: "English", status: "InPro", insertIndex: 0 } });
  assert.equal(ok.ok, true);
  assert.equal(store.getTask("t1").status, "InPro");
});

test("OnHold 先頭のみ InPro へ遷移できる", () => {
  const fail = store.moveTask({ taskId: "t2", to: { subjectId: "English", status: "InPro", insertIndex: 0 } });
  assert.equal(fail.ok, false);

  const ok = store.moveTask({ taskId: "t3", to: { subjectId: "English", status: "InPro", insertIndex: 0 } });
  assert.equal(ok.ok, true);
  assert.equal(store.getTask("t3").status, "InPro");
});

test("InPro 置換時は既存 InPro を OnHold 先頭へ退避する", () => {
  store.moveTask({ taskId: "t1", to: { subjectId: "English", status: "InPro", insertIndex: 0 } });
  const result = store.moveTask({ taskId: "t3", to: { subjectId: "English", status: "InPro", insertIndex: 0 } });
  assert.equal(result.ok, true);
  assert.equal(store.getTask("t3").status, "InPro");
  assert.equal(store.getTask("t1").status, "OnHold");
  // 退避タスクが OnHold 先頭になる（priority が最大になるよう再採番）
  const onHold = store.getTasksByCell("English", "OnHold");
  assert.equal(onHold[0].id, "t1");
});

test("Done へは InPro/OnHold 以外から移動できない", () => {
  const blocked = store.moveTask({ taskId: "t2", to: { subjectId: "English", status: "Done" } });
  assert.equal(blocked.ok, false);
  assert.match(blocked.reason, /invalid-done-source/);
});

test("InPro への insertIndex は 0 のみ許可し、その他は拒否する", () => {
  const blocked = store.moveTask({ taskId: "t1", to: { subjectId: "English", status: "InPro", insertIndex: 2 } });
  assert.equal(blocked.ok, false);
  assert.match(blocked.reason, /invalid-inpro-position/);
});

test("優先度ギャップが足りない場合はセル内で正規化して再採番する", () => {
  store.addTask({ id: "t4", title: "Today low", subjectId: "English", status: "Today", priority: 1999 });
  store.addTask({ id: "t5", title: "Today lower", subjectId: "English", status: "Today", priority: 1998 });
  const res = store.moveTask({ taskId: "t2", to: { subjectId: "English", status: "Today", insertIndex: 1 } });
  assert.equal(res.ok, true);
  const today = store.getTasksByCell("English", "Today");
  assert.equal(today.length, 4);
  // priority が降順でギャップを持っていることを確認
  for (let i = 1; i < today.length; i++) {
    assert.ok(today[i - 1].priority > today[i].priority);
  }
});

test("previewMove は mutate せず可否と理由を返し、moveTask と整合する", () => {
  const preview = store.previewMove({ taskId: "t2", to: { subjectId: "English", status: "InPro", insertIndex: 0 } });
  assert.equal(preview.allowed, false);
  assert.match(preview.reason, /today-not-top/);

  const okPreview = store.previewMove({ taskId: "t1", to: { subjectId: "English", status: "InPro", insertIndex: 0 } });
  assert.equal(okPreview.allowed, true);
  const before = store.getTask("t1").status;
  store.moveTask({ taskId: "t1", to: { subjectId: "English", status: "InPro", insertIndex: 0 } });
  assert.notEqual(before, store.getTask("t1").status);
});

test("InPro 競合は発見順に OnHold 先頭へ積み、優先度を正規化する", () => {
  store.addTask({ id: "t4", title: "InPro first", subjectId: "English", status: "InPro", priority: 5000 });
  store.addTask({ id: "t5", title: "InPro second", subjectId: "English", status: "InPro", priority: 4000 });

  const result = store.normalizeInProConflicts();
  assert.equal(result.moved.length, 2);
  assert.equal(store.getTasksByCell("English", "InPro").length, 0);

  const onHold = store.getTasksByCell("English", "OnHold");
  assert.deepEqual(onHold.map((task) => task.id), ["t5", "t4", "t3"]);
  for (let i = 1; i < onHold.length; i++) {
    assert.ok(onHold[i - 1].priority > onHold[i].priority);
  }
});
