import { initialLabHtml, setupMcpLab } from "./e2e/lab.js";
import { renderKanbanBoard } from "./kanban/board.js";
import { createKanbanLayoutConfig } from "./kanban/layout.js";

const DEFAULT_SUBJECTS = ["国語", "数学", "英語", "理科", "社会", "技術", "音楽", "体育", "家庭科"];

function injectStyles(doc) {
  if (!doc?.head || doc.getElementById?.("kanban-styles")) return;
  const style = doc.createElement("style");
  style.id = "kanban-styles";
  style.textContent = `
:root {
  --lpk-status-col-min-width: 200px;
  --lpk-subject-col-width: 160px;
  --lpk-appbar-height: 64px;
  --lpk-header-height: 56px;
  --lpk-grid-template: var(--lpk-subject-col-width) repeat(6, var(--lpk-status-col-min-width));
  --lpk-surface: #0f172a;
  --lpk-surface-2: #ffffff;
  --lpk-border: #d5deea;
  --lpk-text: #0f172a;
  --lpk-muted: #52606d;
  --lpk-accent: #2563eb;
  --lpk-accent-soft: #e6edff;
  --lpk-bg: radial-gradient(circle at 20% 20%, #f3f6ff 0%, #eef2f7 40%, #e7edf5 70%);
  --lpk-shadow-soft: 0 12px 32px rgba(15, 23, 42, 0.12);
  --lpk-shadow-card: 0 6px 16px rgba(15, 23, 42, 0.08);
}
body {
  margin: 0;
  font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
  background: var(--lpk-bg);
  color: var(--lpk-text);
}
*,
*::before,
*::after {
  box-sizing: border-box;
}
.app-shell {
  min-height: 100vh;
  background: linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.9) 100%);
}
.kanban-appbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  background: #0b1222;
  color: #ffffff;
  height: var(--lpk-appbar-height);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
}
.kanban-appbar__nav {
  display: flex;
  gap: 8px;
  font-size: 14px;
}
.kanban-appbar__nav .nav-item[data-active="true"] {
  color: #cbd5ff;
  font-weight: 700;
}
.kanban-appbar__center {
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
}
.kanban-appbar__date {
  font-size: 15px;
  letter-spacing: 0.02em;
}
.kanban-appbar__logo {
  font-weight: 700;
  letter-spacing: 0.04em;
  font-size: 16px;
}
.kanban-appbar__right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}
.kanban-header {
  position: sticky;
  top: var(--lpk-appbar-height);
  z-index: 9;
  display: grid;
  grid-template-columns: 1.3fr 1.7fr auto;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--lpk-surface-2);
  color: var(--lpk-text);
  border-bottom: 1px solid var(--lpk-border);
  min-height: var(--lpk-header-height);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
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
  background: #e7edf5;
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
  padding: 20px 16px 32px;
}
.kanban-board__scroll {
  background: var(--lpk-surface-2);
  border: 1px solid var(--lpk-border);
  border-radius: 16px;
  box-shadow: var(--lpk-shadow-soft);
  overflow: auto;
  position: relative;
  max-height: calc(100vh - var(--lpk-appbar-height) - var(--lpk-header-height) - 56px);
}
.kanban-board {
  width: 100%;
  min-width: calc(var(--lpk-subject-col-width) + 6 * var(--lpk-status-col-min-width));
  background: linear-gradient(180deg, #f8fbff 0%, #f6f8fb 100%);
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr;
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
  display: grid;
  grid-template-columns: var(--lpk-grid-template, 1fr);
  z-index: 2;
  background: #f8fbff;
  border-bottom: 0;
  width: max-content;
}
.kanban-board .kanban-header__corner {
  position: sticky;
  left: 0;
  width: var(--lpk-subject-col-width);
  background: #f8fbff;
  border-right: 0;
  box-shadow: none;
  pointer-events: none;
  z-index: 4;
  height: 100%;
}
.kanban-header__cells {
  display: grid;
  grid-auto-flow: column;
}
.kanban-board .kanban-header__cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: var(--lpk-status-col-min-width);
  width: var(--lpk-status-col-min-width);
  padding: 6px 8px;
  font-weight: 700;
  font-size: 13px;
  background: #f8fbff;
  border-right: 1px solid var(--lpk-border);
  color: #0f172a;
  letter-spacing: 0.01em;
}
.kanban-board .kanban-header__cell:last-child {
  border-right: 0;
}
.kanban-container {
  display: flex;
  flex-direction: column;
}
.kanban-row {
  display: grid;
  grid-template-columns: var(--lpk-subject-col-width) repeat(6, var(--lpk-status-col-min-width));
  border-bottom: 1px solid var(--lpk-border);
  background: #ffffff;
  width: max-content;
}
.kanban-row:nth-child(2n) {
  background: #f9fbff;
}
.kanban-cell {
  min-width: var(--lpk-status-col-min-width);
  width: var(--lpk-status-col-min-width);
  border-left: 1px solid var(--lpk-border);
  padding: 10px;
  position: relative;
  z-index: 1;
}
.kanban-cell .kanban-card.placeholder {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  padding: 12px;
  margin: 0;
  border: 1px dashed var(--lpk-border);
  border-radius: 12px;
  background: #ffffff;
  color: var(--lpk-text);
  font-size: 14px;
  box-shadow: var(--lpk-shadow-card);
}
.kanban-card.placeholder {
  margin: 6px 0;
}
.kanban-cell .kanban-add {
  position: absolute;
  top: 6px;
  right: 6px;
  border: 1px solid var(--lpk-border);
  background: #fff;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: var(--lpk-shadow-card);
}
.kanban-cell[data-status="Backlog"] .kanban-card.placeholder {
  padding-right: 44px;
}
.kanban-board .kanban-row__subject {
  background: #f8fbff;
  border-right: 1px solid var(--lpk-border);
  font-weight: 700;
  padding: 14px 12px;
  display: flex;
  align-items: center;
  z-index: 1;
}
.mcp-lab {
  margin: 32px 16px 16px;
  padding: 16px;
  border: 1px solid var(--lpk-border);
  border-radius: 12px;
  background: #ffffff;
  box-shadow: var(--lpk-shadow-card);
}
.mcp-lab__controls {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}
.mcp-lab__board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.lab-column {
  border: 1px dashed var(--lpk-border);
  border-radius: 10px;
  background: #f6f8fb;
  min-height: 140px;
}
.lab-column__header {
  padding: 8px 10px;
  font-weight: 700;
  border-bottom: 1px solid var(--lpk-border);
}
.lab-column__list {
  padding: 10px;
}
.lab-column__list[data-drag-over="true"] {
  outline: 2px solid var(--lpk-accent);
}
.lab-card {
  padding: 8px 10px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid var(--lpk-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  cursor: grab;
}
.lab-status {
  font-size: 14px;
  color: var(--lpk-muted);
}
`;
  doc.head.appendChild(style);
}

function formatNow(now = new Date()) {
  const iso = now.toISOString();
  return iso.slice(0, 10) + " " + iso.slice(11, 16);
}

export function buildAppShellHtml(now = new Date()) {
  const subjects = DEFAULT_SUBJECTS;
  const layout = createKanbanLayoutConfig({ subjects, viewportWidth: 1024 });
  const boardHtml = renderKanbanBoard({ subjects, layout });
  const datetime = formatNow(now);
  return `
    <div class="app-shell" data-testid="app-root">
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
        <section class="mcp-lab" data-testid="mcp-lab">
          <div class="mcp-lab__title">MCP E2E Lab</div>
          ${initialLabHtml()}
        </section>
      </main>
    </div>
  `;
}

export function renderAppShell(doc = document) {
  const app = doc.querySelector("#app");
  if (!app) return;
  injectStyles(doc);
  app.innerHTML = buildAppShellHtml();
  setupMcpLab(doc);
  syncKanbanHeaderScroll(doc);
}

if (typeof document !== "undefined") {
  renderAppShell(document);
}

function syncKanbanHeaderScroll(doc) {
  const scroll = doc.querySelector(".kanban-board__scroll");
  const headerCells = doc.querySelector(".kanban-header__cells");
  if (!scroll || !headerCells) return;
  const sync = () => {
    headerCells.style.transform = `translateX(${scroll.scrollLeft}px)`;
    requestAnimationFrame(sync);
  };
  sync();
}
