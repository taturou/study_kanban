import { renderKanbanBoard } from "./kanban/board.js";
import { createKanbanLayoutConfig } from "./kanban/layout.js";

const DEFAULT_SUBJECTS = ["English", "Math", "Science"];

function injectStyles(doc) {
  if (!doc?.head || doc.getElementById?.("kanban-styles")) return;
  const style = doc.createElement("style");
  style.id = "kanban-styles";
  style.textContent = `
:root {
  --lpk-status-col-min-width: 240px;
  --lpk-appbar-height: 64px;
  --lpk-header-height: 72px;
  --lpk-surface: #ffffff;
  --lpk-border: #d8e2ec;
  --lpk-text: #1f2933;
  --lpk-muted: #52606d;
  --lpk-accent: #2563eb;
  --lpk-bg: #f6f8fb;
}
body {
  margin: 0;
  font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
  background: var(--lpk-bg);
  color: var(--lpk-text);
}
.app-shell {
  min-height: 100vh;
}
.kanban-appbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #1f2933;
  color: #ffffff;
  height: var(--lpk-appbar-height);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}
.kanban-appbar__nav {
  display: flex;
  gap: 8px;
  font-size: 14px;
}
.kanban-appbar__nav .nav-item[data-active="true"] {
  color: var(--lpk-accent);
  font-weight: 700;
}
.kanban-header {
  position: sticky;
  top: var(--lpk-appbar-height);
  z-index: 9;
  display: grid;
  grid-template-columns: 1fr 2fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--lpk-surface);
  color: var(--lpk-text);
  border-bottom: 1px solid var(--lpk-border);
  height: var(--lpk-header-height);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}
.kanban-header__gauge {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.gauge-bar {
  position: relative;
  width: 100%;
  height: 10px;
  background: #e5e8ec;
  border-radius: 999px;
  overflow: hidden;
}
.gauge-bar__fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 45%;
  background: var(--lpk-accent);
}
.kanban-board__container {
  padding: 16px;
}
.kanban-board__scroll {
  background: var(--lpk-surface);
  border: 1px solid var(--lpk-border);
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}
.kanban-board {
  width: 100%;
}
.kanban-header__meta {
  display: flex;
  gap: 12px;
  color: var(--lpk-muted);
  font-size: 13px;
}
.kanban-board [data-scroll-horizontal="true"] {
  overflow-x: auto;
}
.kanban-board .kanban-header {
  position: sticky;
  top: 0;
}
.kanban-board .kanban-cell {
  min-width: var(--lpk-status-col-min-width);
  border-left: 1px solid var(--lpk-border);
}
.kanban-board .kanban-row__subject {
  position: sticky;
  left: 0;
  background: var(--lpk-surface);
  border-right: 1px solid var(--lpk-border);
}
.kanban-board .kanban-header__cell {
  position: sticky;
  top: 0;
  background: var(--lpk-surface);
  border-bottom: 1px solid var(--lpk-border);
  border-right: 1px solid var(--lpk-border);
}
.kanban-card.placeholder {
  padding: 12px;
  margin: 8px;
  border: 1px dashed var(--lpk-border);
  border-radius: 10px;
  background: #f9fbff;
  color: var(--lpk-muted);
  font-size: 14px;
}
`;
  doc.head.appendChild(style);
}

function formatNow() {
  const now = new Date();
  const iso = now.toISOString();
  return iso.slice(0, 10) + " " + iso.slice(11, 16);
}

export function renderAppShell(doc = document) {
  const app = doc.querySelector("#app");
  if (!app) return;
  injectStyles(doc);
  const subjects = DEFAULT_SUBJECTS;
  const layout = createKanbanLayoutConfig({ subjects, viewportWidth: 1024 });
  const boardHtml = renderKanbanBoard({ subjects, layout });
  const datetime = formatNow();
  app.innerHTML = `
    <div class="app-shell">
      <header class="kanban-appbar" data-testid="app-bar" data-fixed="true">
        <div class="kanban-appbar__left">
          <button class="app-bar__menu" aria-label="メニュー">☰</button>
          <span class="app-bar__logo">LPK</span>
        </div>
        <div class="kanban-appbar__center">
          <div class="kanban-appbar__date" data-testid="app-datetime">${datetime}</div>
          <nav class="kanban-appbar__nav">
            <span class="nav-item" data-view="kanban" data-active="true">Kanban</span>
            <span class="nav-item" data-view="dashboard">Dashboard</span>
            <span class="nav-item" data-view="calendar">Calendar</span>
          </nav>
        </div>
        <div class="kanban-appbar__right">
          <span class="kanban-appbar__sync" data-testid="app-sync">● Sync</span>
          <span class="kanban-appbar__avatar" data-testid="app-avatar">👤</span>
        </div>
      </header>
      <section class="kanban-header" data-testid="kanban-header" data-fixed="true">
        <div class="kanban-header__meta" data-testid="kanban-meta">
          <span>Today: 0</span>
          <span>Done: 0</span>
        </div>
        <div class="kanban-header__gauge" data-testid="availability-gauge">
          <div class="gauge-bar" aria-hidden="true"><span class="gauge-bar__fill"></span></div>
          <small>学習可能時間: 0 / 120 min</small>
        </div>
        <button class="kanban-header__pomodoro" data-testid="pomodoro-button">Pomodoro Start</button>
      </section>
      <main class="kanban-main">
        <div class="kanban-board__container">
          <div class="kanban-board__scroll">
            ${boardHtml}
          </div>
        </div>
      </main>
    </div>
  `;
}

if (typeof document !== "undefined") {
  renderAppShell(document);
}
