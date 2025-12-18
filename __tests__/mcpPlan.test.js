import assert from "node:assert/strict";
import { test } from "node:test";
import { E2E_SELECTORS, buildMcpPlan, serializeMcpPlan } from "../src/e2e/mcpPlan.js";

test("MCPプランはターゲットURLと主要セレクタを提供する", () => {
  const plan = buildMcpPlan();
  assert.equal(plan.targetUrl, "http://localhost:5173/");
  assert.ok(plan.selectors.appRoot);
  assert.ok(plan.selectors.appBar);
  assert.ok(plan.selectors.kanbanBoard);
  assert.ok(plan.selectors.lab.root);
  assert.ok(plan.selectors.lab.backlog);
  assert.ok(plan.selectors.lab.today);
  assert.ok(plan.selectors.lab.done);
  assert.ok(plan.selectors.lab.card);
  assert.ok(plan.selectors.lab.input);
  assert.ok(plan.selectors.lab.createButton);
  assert.ok(plan.selectors.lab.status);
  assert.deepEqual(plan.selectors, E2E_SELECTORS);
});

test("タスク作成とDnDシナリオが含まれ、スナップショット検証も定義されている", () => {
  const plan = buildMcpPlan();
  const create = plan.scenarios.find((s) => s.id === "task-create");
  const drag = plan.scenarios.find((s) => s.id === "drag-and-drop");
  assert.ok(create, "task-create シナリオが必要");
  assert.ok(drag, "drag-and-drop シナリオが必要");

  assert.deepEqual(
    create.steps.map((s) => s.action),
    ["open", "waitFor", "waitFor", "type", "click", "waitForText", "assertCount"],
  );
  assert.deepEqual(
    drag.steps.map((s) => s.action),
    ["open", "waitFor", "waitFor", "dragAndDrop", "assertAttribute"],
  );

  assert.ok(plan.snapshots.length > 0);
  const snapshotTargets = plan.snapshots.flatMap((s) => s.targets);
  assert.ok(snapshotTargets.includes(E2E_SELECTORS.appBar));
  assert.ok(snapshotTargets.includes(E2E_SELECTORS.kanbanBoard));
  assert.ok(snapshotTargets.includes(E2E_SELECTORS.lab.root));
});

test("プランはJSONとしてシリアライズできる", () => {
  const plan = buildMcpPlan();
  const json = serializeMcpPlan(plan);
  const parsed = JSON.parse(json);
  assert.equal(parsed.targetUrl, plan.targetUrl);
  assert.equal(parsed.scenarios.length, plan.scenarios.length);
});
