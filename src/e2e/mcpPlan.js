export const E2E_SELECTORS = {
  appRoot: '[data-testid="app-root"]',
  appBar: '[data-testid="app-bar"]',
  kanbanBoard: '[data-testid="kanban-board"]',
};

function snapshotTargets() {
  return [
    {
      description: "AppShell と Kanban の固定レイアウトを a11y スナップショットで確認する",
      targets: [E2E_SELECTORS.appBar, E2E_SELECTORS.kanbanBoard],
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
        id: "app-shell",
        description: "AppShell の主要要素が描画されることを確認する",
        steps: [
          { action: "open", url: targetUrl },
          { action: "waitFor", target: E2E_SELECTORS.appRoot },
          { action: "waitFor", target: E2E_SELECTORS.kanbanBoard },
        ],
      },
    ],
  };
}

export function serializeMcpPlan(plan) {
  return JSON.stringify(plan, null, 2);
}
