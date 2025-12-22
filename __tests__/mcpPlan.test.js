import assert from "node:assert/strict";
import { test } from "vitest";
import { E2E_SELECTORS, buildMcpPlan, serializeMcpPlan } from "../src/e2e/mcpPlan";

test("MCPプランはターゲットURLと主要セレクタを提供する", () => {
  const plan = buildMcpPlan();
  assert.equal(plan.targetUrl, "http://localhost:5173/");
  assert.ok(plan.selectors.appRoot);
  assert.ok(plan.selectors.appBar);
  assert.ok(plan.selectors.kanbanBoard);
  assert.deepEqual(plan.selectors, E2E_SELECTORS);
});

test("AppShell 確認シナリオが含まれ、スナップショット検証も定義されている", () => {
  const plan = buildMcpPlan();
  const appShell = plan.scenarios.find((s) => s.id === "app-shell");
  assert.ok(appShell, "app-shell シナリオが必要");

  assert.deepEqual(
    appShell.steps.map((s) => s.action),
    ["open", "waitFor", "waitFor"],
  );

  assert.ok(plan.snapshots.length > 0);
  const snapshotTargets = plan.snapshots.flatMap((s) => s.targets);
  assert.ok(snapshotTargets.includes(E2E_SELECTORS.appBar));
  assert.ok(snapshotTargets.includes(E2E_SELECTORS.kanbanBoard));
});

test("プランはJSONとしてシリアライズできる", () => {
  const plan = buildMcpPlan();
  const json = serializeMcpPlan(plan);
  const parsed = JSON.parse(json);
  assert.equal(parsed.targetUrl, plan.targetUrl);
  assert.equal(parsed.scenarios.length, plan.scenarios.length);
});
