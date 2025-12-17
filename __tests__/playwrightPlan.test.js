import assert from "node:assert/strict";
import { test } from "node:test";
import { playwrightPlan } from "../scripts/playwright-plan.js";

test("Playwright MCP 用シナリオが AppBar と Kanban の sticky/スクロールを検証する", () => {
  const stickyScenario = playwrightPlan.find((s) => s.id === "kanban-sticky");
  assert.ok(stickyScenario, "sticky シナリオが存在する");
  assert.match(stickyScenario.description, /sticky/);
  assert.ok(stickyScenario.steps.some((step) => step.includes("position: sticky")));
  assert.ok(stickyScenario.steps.some((step) => step.includes("top: 0")));
});

test("Playwright MCP 用シナリオが最小列幅とプレースホルダー表示を検証する", () => {
  const layoutScenario = playwrightPlan.find((s) => s.id === "kanban-layout");
  assert.ok(layoutScenario, "レイアウトシナリオが存在する");
  const hasMinWidth = layoutScenario.steps.some((step) => step.includes("--lpk-status-col-min-width"));
  const hasPlaceholder = layoutScenario.steps.some((step) => step.includes(".kanban-card.placeholder"));
  assert.equal(hasMinWidth, true);
  assert.equal(hasPlaceholder, true);
});
