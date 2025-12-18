import { summarizeLabState } from "./labState.js";

export const E2E_SELECTORS = {
  appRoot: '[data-testid="app-root"]',
  appBar: '[data-testid="app-bar"]',
  kanbanBoard: '[data-testid="kanban-board"]',
  lab: {
    root: '[data-testid="mcp-lab"]',
    backlog: '[data-testid="lab-backlog-list"]',
    today: '[data-testid="lab-today-list"]',
    done: '[data-testid="lab-done-list"]',
    card: '[data-testid="lab-card"]',
    input: '[data-testid="lab-task-input"]',
    createButton: '[data-testid="lab-create-button"]',
    status: '[data-testid="lab-status"]',
  },
};

function snapshotTargets() {
  return [
    {
      description: "AppShell と Kanban の固定レイアウトを a11y スナップショットで確認する",
      targets: [E2E_SELECTORS.appBar, E2E_SELECTORS.kanbanBoard],
    },
    {
      description: "MCP ラボの DOM 変化を a11y ツリーで確認する",
      targets: [E2E_SELECTORS.lab.root, E2E_SELECTORS.lab.status],
    },
  ];
}

export function buildMcpPlan({ targetUrl = "http://localhost:5173/" } = {}) {
  return {
    targetUrl,
    selectors: E2E_SELECTORS,
    snapshots: snapshotTargets(),
    scenarios: [
      {
        id: "task-create",
        description: "ラボでタスクを追加し、DOM のテキストと件数変化を検証する",
        steps: [
          { action: "open", url: targetUrl },
          { action: "waitFor", target: E2E_SELECTORS.lab.root },
          { action: "waitFor", target: E2E_SELECTORS.lab.createButton },
          { action: "type", target: E2E_SELECTORS.lab.input, text: "MCP 追加タスク" },
          { action: "click", target: E2E_SELECTORS.lab.createButton },
          { action: "waitForText", target: E2E_SELECTORS.lab.backlog, text: "MCP 追加タスク" },
          { action: "assertCount", target: E2E_SELECTORS.lab.card, min: 2 },
        ],
      },
      {
        id: "drag-and-drop",
        description: "既存タスクを Today へドラッグし、リスト属性の変化を検証する",
        steps: [
          { action: "open", url: targetUrl },
          { action: "waitFor", target: E2E_SELECTORS.lab.card },
          { action: "waitFor", target: E2E_SELECTORS.lab.today },
          { action: "dragAndDrop", source: E2E_SELECTORS.lab.card, target: E2E_SELECTORS.lab.today },
          { action: "assertAttribute", target: E2E_SELECTORS.lab.today, attribute: "data-has-card", equals: "true" },
        ],
      },
    ],
  };
}

export function serializeMcpPlan(plan) {
  return JSON.stringify(plan, null, 2);
}

export function describeLabForAgent(state) {
  const summary = summarizeLabState(state);
  return {
    snapshotHint: "Backlog/Today/Done 列に data-testid を付与したミニボード。カードは drag&drop で移動。",
    summary,
  };
}
