import assert from "node:assert/strict";
import { test } from "node:test";
import { createStatusPolicy, POLICY_ERRORS, STATUS_ORDER } from "../src/status/policy.js";

const policy = createStatusPolicy();

test("Today 先頭以外は InPro へ遷移できない", () => {
  const decision = policy.validateMove({
    taskId: "t1",
    from: { subjectId: "English", status: "Today", priority: 10 },
    to: { subjectId: "English", status: "InPro", insertIndex: 0 },
    context: {
      hasOtherInPro: false,
      isTopOfToday: false,
      isTopOfOnHold: false,
    },
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, POLICY_ERRORS.TODAY_NOT_TOP);
});

test("OnHold 先頭のみ InPro へ遷移できる", () => {
  const decision = policy.validateMove({
    taskId: "t2",
    from: { subjectId: "Math", status: "OnHold", priority: 50 },
    to: { subjectId: "Math", status: "InPro", insertIndex: 0 },
    context: {
      hasOtherInPro: false,
      isTopOfToday: false,
      isTopOfOnHold: false,
    },
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, POLICY_ERRORS.ONHOLD_NOT_TOP);
});

test("Done には InPro/OnHold 以外から遷移できない", () => {
  const decision = policy.validateMove({
    taskId: "t3",
    from: { subjectId: "English", status: "Today", priority: 1 },
    to: { subjectId: "English", status: "Done" },
    context: { hasOtherInPro: false, isTopOfOnHold: false, isTopOfToday: false },
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, POLICY_ERRORS.INVALID_DONE_SOURCE);
});

test("既存 InPro がある場合は OnHold 先頭へ自動退避を返す", () => {
  const decision = policy.validateMove({
    taskId: "t4",
    from: { subjectId: "English", status: "Today", priority: 0 },
    to: { subjectId: "English", status: "InPro", insertIndex: 0 },
    context: {
      hasOtherInPro: true,
      inProTaskId: "current-inpro",
      inProSubjectId: "English",
      isTopOfToday: true,
      isTopOfOnHold: false,
    },
  });

  assert.equal(decision.allowed, true);
  assert.deepEqual(decision.sideEffects, [
    { kind: "autoMoveToOnHold", taskId: "current-inpro" },
    { kind: "normalizePriorities", subjectId: "English", status: "OnHold" },
  ]);
});

test("InPro への挿入は先頭（insertIndex=0）以外は拒否する", () => {
  const decision = policy.validateMove({
    taskId: "t5",
    from: { subjectId: "English", status: "Today", priority: 0 },
    to: { subjectId: "English", status: "InPro", insertIndex: 2 },
    context: { hasOtherInPro: false, isTopOfToday: true, isTopOfOnHold: false },
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, POLICY_ERRORS.INVALID_INPRO_POSITION);
});

test("定義外ステータスへの遷移は拒否する", () => {
  const decision = policy.validateMove({
    taskId: "t6",
    from: { subjectId: "English", status: "Today", priority: 0 },
    to: { subjectId: "English", status: "Unknown" },
    context: { hasOtherInPro: false, isTopOfToday: true, isTopOfOnHold: false },
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, POLICY_ERRORS.INVALID_STATUS);
});

test("定義済みステータス集合を公開する", () => {
  assert.deepEqual(STATUS_ORDER, ["Backlog", "Today", "InPro", "OnHold", "Done", "WontFix"]);
});
