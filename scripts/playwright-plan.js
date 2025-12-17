export const playwrightPlan = [
  {
    id: "kanban-sticky",
    description: "AppBar と KanbanHeader がスクロール時に sticky で固定されることを検証する",
    steps: [
      "open page at http://localhost:5173/",
      "scroll vertically by 400px",
      "expect [data-testid=\"app-bar\"] to have CSS position: sticky and top: 0px",
      "expect [data-testid=\"kanban-header\"] to have CSS position: sticky and top: 64px",
      "take screenshot kanban-sticky.png for visual diff",
    ],
  },
  {
    id: "kanban-layout",
    description: "ステータス列の最小幅とプレースホルダー表示を確認する",
    steps: [
      "open page at http://localhost:5173/",
      "expect :root to include CSS variable --lpk-status-col-min-width",
      "expect .kanban-card.placeholder to be visible",
      "expect [data-scroll-horizontal=\"true\"] to allow horizontal scrolling (boundingBox width > viewport)",
      "take screenshot kanban-layout.png for visual diff",
    ],
  },
];
