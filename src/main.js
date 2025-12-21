import { renderKanbanBoard } from "./kanban/board.js";
import { createKanbanLayoutConfig } from "./kanban/layout.js";
import { createKanbanController } from "./kanban/controller.js";
import { computeInsertIndex, getDropFeedback } from "./kanban/dnd.js";
import { computeSprintRange, formatSprintRange } from "./sprint/range.js";

const DEFAULT_SUBJECTS = ["国語", "数学", "英語", "理科", "社会", "技術", "音楽", "体育", "家庭科"];
const BOARD_HORIZONTAL_PADDING = 32;

function injectStyles(doc) {
  if (!doc?.head || doc.getElementById?.("kanban-styles")) return;
  const style = doc.createElement("style");
  style.id = "kanban-styles";
  style.textContent = `
:root {
  --lpk-status-col-min-width: 200px;
  --lpk-subject-col-width: 160px;
  --lpk-total-width: auto;
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
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  max-height: calc(100vh - var(--lpk-appbar-height) - var(--lpk-header-height) - 56px);
}
.kanban-board__scroll[data-scroll-horizontal="true"] {
  overflow-x: auto;
}
.kanban-board {
  width: 100%;
  min-width: var(--lpk-total-width);
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
  width: var(--lpk-total-width);
  min-width: var(--lpk-total-width);
  z-index: 2;
  background: #f8fbff;
  border-bottom: 0;
  padding: 0;
  gap: 0;
}
.kanban-board .kanban-header__corner {
  width: var(--lpk-subject-col-width);
  background: #f8fbff;
  height: 100%;
}
.kanban-header__cells {
  display: grid;
  grid-template-columns: var(--lpk-status-columns, repeat(6, var(--lpk-status-col-min-width)));
  grid-column: 2 / span 6;
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
  grid-template-columns: var(--lpk-grid-template);
  border-bottom: 1px solid var(--lpk-border);
  background: #ffffff;
  width: var(--lpk-total-width);
  min-width: var(--lpk-total-width);
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
.kanban-cell__tasks {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.kanban-card {
  padding: 10px 12px;
  background: #fff;
  border: 1px solid var(--lpk-border);
  border-radius: 10px;
  box-shadow: var(--lpk-shadow-card);
  cursor: grab;
}
.kanban-card.is-dragging {
  opacity: 0.35;
  border-style: dashed;
  border-color: var(--lpk-accent);
  background: rgba(59, 130, 246, 0.06);
  box-shadow: none;
}
.kanban-card--square {
  aspect-ratio: 1 / 1;
}
.kanban-card__meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--lpk-muted);
}
.kanban-card__gauge {
  margin-top: 6px;
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--lpk-muted);
}
.kanban-card__title {
  font-weight: 700;
  font-size: 14px;
}
.kanban-drop-preview {
  min-height: 56px;
  border: 2px dashed var(--lpk-accent);
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.08);
  pointer-events: none;
}
.kanban-drop-preview--square {
  aspect-ratio: 1 / 1;
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
.kanban-board .kanban-row__subject {
  background: #f8fbff;
  border-right: 1px solid var(--lpk-border);
  font-weight: 700;
  padding: 14px 12px;
  display: flex;
  align-items: center;
  z-index: 1;
}
.kanban-cell[data-drop-allowed="true"] {
  background: rgba(59, 130, 246, 0.04);
}
.task-dialog__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}
.task-dialog {
  background: #ffffff;
  border-radius: 16px;
  width: min(560px, 92vw);
  padding: 20px;
  box-shadow: var(--lpk-shadow-soft);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.task-dialog__row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.task-dialog__row label {
  font-size: 12px;
  color: var(--lpk-muted);
}
.task-dialog__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.settings-panel {
  position: fixed;
  top: var(--lpk-appbar-height);
  right: 16px;
  width: min(360px, 92vw);
  background: #ffffff;
  border: 1px solid var(--lpk-border);
  border-radius: 16px;
  padding: 16px;
  box-shadow: var(--lpk-shadow-soft);
  display: none;
  z-index: 15;
}
.settings-panel[data-open="true"] {
  display: block;
}
.settings-panel__section {
  margin-top: 12px;
}
.settings-panel__section h3 {
  margin: 0 0 8px;
  font-size: 14px;
}
.settings-panel__status {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}
.settings-panel__subjects {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.settings-panel__subject {
  display: flex;
  align-items: center;
  gap: 6px;
}
`;
  doc.head.appendChild(style);
}

function formatNow(now = new Date()) {
  const iso = now.toISOString();
  return iso.slice(0, 10) + " " + iso.slice(11, 16);
}

function buildSettingsPanelHtml(controller) {
  if (!controller) return "";
  const labels = controller.getStatusLabels();
  const subjects = controller.getSubjects();
  const statusInputs = Object.entries(labels)
    .map(
      ([status, label]) => `
        <div class="settings-panel__status">
          <span>${status}</span>
          <input type="text" data-status-label="${status}" value="${label}" />
        </div>
      `,
    )
    .join("");
  const subjectRows = subjects
    .map(
      (subject, index) => `
        <div class="settings-panel__subject">
          <span>${subject}</span>
          <button data-subject-move="up" data-subject="${subject}" ${index === 0 ? "disabled" : ""}>↑</button>
          <button data-subject-move="down" data-subject="${subject}" ${index === subjects.length - 1 ? "disabled" : ""}>↓</button>
          <button data-subject-delete="${subject}">削除</button>
        </div>
      `,
    )
    .join("");
  return `
    <section class="settings-panel" data-testid="settings-panel" data-open="false">
      <h2>Settings</h2>
      <div class="settings-panel__section">
        <h3>ステータス表示名</h3>
        ${statusInputs}
      </div>
      <div class="settings-panel__section">
        <h3>教科</h3>
        <div class="settings-panel__subjects">${subjectRows}</div>
      </div>
    </section>
  `;
}

function buildTaskDialogHtml(dialogState) {
  if (!dialogState) return "";
  const task = dialogState.task ?? {};
  const actuals = Array.isArray(task.actuals) ? task.actuals : [];
  const actualRows = actuals
    .map(
      (actual) => `
        <div class="task-dialog__actual">
          <input type="date" data-actual-id="${actual.id}" data-actual-field="at" value="${actual.at ?? ""}" />
          <input type="number" data-actual-id="${actual.id}" data-actual-field="minutes" value="${actual.minutes ?? 0}" />
          <button data-actual-delete="${actual.id}">削除</button>
        </div>
      `,
    )
    .join("");
  return `
    <div class="task-dialog__backdrop" data-testid="task-dialog">
      <div class="task-dialog" role="dialog" aria-modal="true">
        <div class="task-dialog__row">
          <label>タイトル</label>
          <input type="text" data-dialog-field="title" value="${task.title ?? ""}" />
        </div>
        <div class="task-dialog__row">
          <label>詳細</label>
          <textarea data-dialog-field="detail">${task.detail ?? ""}</textarea>
        </div>
        <div class="task-dialog__row">
          <label>期日</label>
          <input type="date" data-dialog-field="dueAt" value="${task.dueAt ?? ""}" />
        </div>
        <div class="task-dialog__row">
          <label>予定時間 (分)</label>
          <input type="number" data-dialog-field="estimateMinutes" value="${task.estimateMinutes ?? 0}" />
        </div>
        <div class="task-dialog__row">
          <label>実績</label>
          ${actualRows}
          <button data-actual-add>実績を追加</button>
        </div>
        <div class="task-dialog__actions">
          <button data-dialog-action="cancel">キャンセル</button>
          <button data-dialog-action="delete">消去</button>
          <button data-dialog-action="save">保存</button>
        </div>
      </div>
    </div>
  `;
}

function collectDialogValues(dialog) {
  const getValue = (selector) => dialog.querySelector(selector)?.value ?? "";
  const updates = {
    title: getValue('[data-dialog-field="title"]'),
    detail: getValue('[data-dialog-field="detail"]'),
    dueAt: getValue('[data-dialog-field="dueAt"]'),
    estimateMinutes: Number(getValue('[data-dialog-field="estimateMinutes"]') || 0),
  };
  const actualsById = new Map();
  dialog.querySelectorAll("[data-actual-id]").forEach((input) => {
    const id = input.dataset.actualId;
    if (!actualsById.has(id)) {
      actualsById.set(id, { id });
    }
    const entry = actualsById.get(id);
    if (input.dataset.actualField === "at") {
      entry.at = input.value;
    }
    if (input.dataset.actualField === "minutes") {
      entry.minutes = Number(input.value || 0);
    }
  });
  if (actualsById.size) {
    updates.actuals = Array.from(actualsById.values()).filter((entry) => entry.at || entry.minutes);
  }
  return updates;
}

export function buildAppShellHtml(now = new Date(), viewportWidth = 1024, controller = null) {
  const subjects = controller?.getSubjects() ?? DEFAULT_SUBJECTS;
  const adjustedWidth = Math.max(320, viewportWidth - BOARD_HORIZONTAL_PADDING);
  const layout = createKanbanLayoutConfig({ subjects, viewportWidth: adjustedWidth });
  const tasks = controller?.listTasks() ?? [];
  const statusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] ?? 0) + 1;
    return acc;
  }, {});
  const statusLabels = controller?.getStatusLabels?.() ?? {};
  const boardHtml = renderKanbanBoard({ subjects, layout: { ...layout, tasks, statusLabels } });
  const datetime = formatNow(now);
  const sprintLabel = controller?.getSprintLabel?.() ?? formatSprintRange(computeSprintRange(now));
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
          <span>Today: ${statusCounts.Today ?? 0}</span>
          <span>Done: ${statusCounts.Done ?? 0}</span>
          <span data-testid="sprint-range">${sprintLabel}</span>
        </div>
        <div class="kanban-header__gauge" data-testid="availability-gauge">
          <div class="gauge-bar" aria-hidden="true"><span class="gauge-bar__fill"></span></div>
          <small>学習可能時間: 0 / 120 min</small>
        </div>
        <button class="kanban-header__pomodoro" data-testid="pomodoro-button">Pomodoro Start</button>
      </section>
      <main class="kanban-main">
        <div class="kanban-board__container">
          <div class="kanban-board__scroll" data-scroll-horizontal="${layout.scroll.horizontal}">
            ${boardHtml}
          </div>
        </div>
        ${buildSettingsPanelHtml(controller)}
      </main>
      ${buildTaskDialogHtml(controller?.getDialogState?.())}
    </div>
  `;
}

export function renderAppShell(doc = document) {
  const app = doc.querySelector("#app");
  if (!app) return;
  injectStyles(doc);
  const controller = createKanbanController({ subjects: DEFAULT_SUBJECTS, now: new Date() });
  let settingsOpen = false;
  let dragMeta = null;
  let dropPreview = null;
  let dropPreviewCell = null;
  let dragGhost = null;

  const clearDropPreview = () => {
    if (dropPreview && dropPreview.parentElement) {
      dropPreview.parentElement.removeChild(dropPreview);
    }
    if (dropPreviewCell) {
      dropPreviewCell.dataset.dropAllowed = "false";
    }
    dropPreview = null;
    dropPreviewCell = null;
  };

  const clearDragGhost = () => {
    if (dragGhost && dragGhost.parentElement) {
      dragGhost.parentElement.removeChild(dragGhost);
    }
    dragGhost = null;
  };

  const ensureDropPreview = ({ cell, insertIndex, status }) => {
    if (!cell) return;
    const container = cell.querySelector(".kanban-cell__tasks");
    if (!container) return;
    if (!dropPreview) {
      dropPreview = doc.createElement("div");
      dropPreview.className = "kanban-drop-preview";
    }
    dropPreview.classList.toggle("kanban-drop-preview--square", status === "InPro");

    if (dropPreviewCell && dropPreviewCell !== cell) {
      dropPreviewCell.dataset.dropAllowed = "false";
    }

    if (dropPreview.parentElement && dropPreview.parentElement !== container) {
      dropPreview.parentElement.removeChild(dropPreview);
    }

    const children = Array.from(container.children).filter((child) => child !== dropPreview);
    const targetIndex = insertIndex ?? children.length;
    const clampedIndex = Math.max(0, Math.min(targetIndex, children.length));
    const before = children[clampedIndex] ?? null;
    container.insertBefore(dropPreview, before);
    dropPreviewCell = cell;
  };

  const computeInsertIndexFromPointer = ({ cell, event, dragId }) => {
    const container = cell.querySelector(".kanban-cell__tasks");
    if (!container) return { insertIndexRaw: null, length: 0 };
    const cards = Array.from(container.querySelectorAll(".kanban-card")).filter(
      (card) => card.dataset.taskId !== dragId,
    );
    const length = cards.length;
    let insertIndexRaw = null;
    for (let i = 0; i < cards.length; i += 1) {
      const rect = cards[i].getBoundingClientRect();
      if (event.clientY < rect.top + rect.height / 2) {
        insertIndexRaw = i;
        break;
      }
    }
    if (insertIndexRaw === null && cards.length) {
      insertIndexRaw = cards.length;
    }
    return { insertIndexRaw, length };
  };

  const render = () => {
    const viewportWidth = doc?.documentElement?.clientWidth ?? 1024;
    app.innerHTML = buildAppShellHtml(new Date(), viewportWidth, controller);
    if (typeof app.querySelectorAll !== "function") {
      return;
    }
    bindEvents();
  };

  const bindEvents = () => {
    const menuButton = app.querySelector(".app-bar__menu");
    const settingsPanel = app.querySelector('[data-testid="settings-panel"]');
    if (menuButton && settingsPanel) {
      settingsPanel.dataset.open = settingsOpen ? "true" : "false";
      menuButton.addEventListener("click", () => {
        settingsOpen = !settingsOpen;
        settingsPanel.dataset.open = settingsOpen ? "true" : "false";
      });
    }

    app.querySelectorAll("[data-status-label]").forEach((input) => {
      input.addEventListener("change", (event) => {
        const target = event.target;
        controller.updateStatusLabel(target.dataset.statusLabel, target.value);
        render();
      });
    });

    app.querySelectorAll("[data-subject-move]").forEach((button) => {
      button.addEventListener("click", (event) => {
        const target = event.target;
        const subject = target.dataset.subject;
        const direction = target.dataset.subjectMove;
        const subjects = controller.getSubjects();
        const index = subjects.indexOf(subject);
        if (index === -1) return;
        const swapIndex = direction === "up" ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= subjects.length) return;
        const next = [...subjects];
        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
        controller.setSubjectOrder(next);
        render();
      });
    });

    app.querySelectorAll("[data-subject-delete]").forEach((button) => {
      button.addEventListener("click", (event) => {
        const target = event.target;
        const subject = target.dataset.subjectDelete;
        const result = controller.deleteSubject(subject);
        if (result?.ok === false) {
          alert(result.reason);
          return;
        }
        render();
      });
    });

    app.querySelectorAll(".kanban-cell .kanban-add").forEach((button) => {
      button.addEventListener("click", (event) => {
        const cell = event.target.closest(".kanban-cell");
        if (!cell) return;
        controller.openNewTaskDialog({
          subjectId: cell.getAttribute("data-subject"),
          status: cell.getAttribute("data-status"),
        });
        render();
        const titleInput = app.querySelector('[data-dialog-field="title"]');
        if (titleInput) titleInput.focus();
      });
    });

    app.querySelectorAll(".kanban-card").forEach((card) => {
      card.addEventListener("click", () => {
        controller.openEditTaskDialog(card.dataset.taskId);
        render();
        const titleInput = app.querySelector('[data-dialog-field="title"]');
        if (titleInput) titleInput.focus();
      });
    });

    const dialog = app.querySelector('[data-testid="task-dialog"]');
    if (dialog) {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) {
          controller.closeDialog();
          render();
        }
      });
      dialog.querySelectorAll("[data-dialog-action]").forEach((button) => {
        button.addEventListener("click", (event) => {
          const action = event.target.dataset.dialogAction;
          if (action === "cancel") {
            controller.closeDialog();
            render();
            return;
          }
          if (action === "delete") {
            controller.deleteDialogTask();
            render();
            return;
          }
          if (action === "save") {
            const updates = collectDialogValues(dialog);
            controller.saveDialog(updates);
            render();
          }
        });
      });
      const addActualButton = dialog.querySelector("[data-actual-add]");
      if (addActualButton) {
        addActualButton.addEventListener("click", () => {
          const row = doc.createElement("div");
          const id = Math.random().toString(36).slice(2, 10);
          row.className = "task-dialog__actual";
          row.innerHTML = `
            <input type="date" data-actual-id="${id}" data-actual-field="at" />
            <input type="number" data-actual-id="${id}" data-actual-field="minutes" value="0" />
            <button data-actual-delete="${id}">削除</button>
          `;
          addActualButton.before(row);
        });
      }
      dialog.querySelectorAll("[data-actual-delete]").forEach((button) => {
        button.addEventListener("click", (event) => {
          const target = event.target;
          const row = target.closest(".task-dialog__actual");
          if (row) row.remove();
        });
      });
    }

    app.querySelectorAll(".kanban-card").forEach((card) => {
      card.addEventListener("dragstart", (event) => {
        card.classList.add("is-dragging");
        const rect = card.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;
        const ghost = card.cloneNode(true);
        ghost.style.position = "fixed";
        ghost.style.top = "-1000px";
        ghost.style.left = "-1000px";
        ghost.style.margin = "0";
        ghost.style.opacity = "1";
        ghost.style.pointerEvents = "none";
        doc.body.appendChild(ghost);
        dragGhost = ghost;
        if (event.dataTransfer?.setDragImage) {
          event.dataTransfer.setDragImage(ghost, offsetX, offsetY);
        }
        dragMeta = {
          id: card.dataset.taskId,
          subject: card.dataset.subject,
          status: card.dataset.status,
          index: Number(card.dataset.index ?? 0),
        };
        event.dataTransfer.effectAllowed = "move";
      });
      card.addEventListener("dragend", () => {
        card.classList.remove("is-dragging");
        dragMeta = null;
        clearDropPreview();
        clearDragGhost();
      });
    });

    app.querySelectorAll(".kanban-cell").forEach((cell) => {
      cell.addEventListener("dragover", (event) => {
        if (!dragMeta) return;
        event.preventDefault();
        const subjectId = cell.getAttribute("data-subject");
        const status = cell.getAttribute("data-status");
        const { insertIndexRaw, length } = computeInsertIndexFromPointer({
          cell,
          event,
          dragId: dragMeta.id,
        });
        const isSameCell = dragMeta.subject === subjectId && dragMeta.status === status;
        const targetIndex = status === "InPro" ? 0 : insertIndexRaw;
        const insertIndex = computeInsertIndex({
          targetIndex,
          dragMeta,
          containerLength: length,
          isSameCell,
        });
        const feedback = getDropFeedback(controller, { taskId: dragMeta.id, to: { subjectId, status, insertIndex } });
        cell.dataset.dropAllowed = feedback.highlight ? "true" : "false";
        if (feedback.highlight && !(isSameCell && insertIndex === dragMeta.index)) {
          ensureDropPreview({ cell, insertIndex, status });
        } else {
          clearDropPreview();
        }
      });

      cell.addEventListener("drop", (event) => {
        if (!dragMeta) return;
        event.preventDefault();
        const subjectId = cell.getAttribute("data-subject");
        const status = cell.getAttribute("data-status");
        const { insertIndexRaw, length } = computeInsertIndexFromPointer({
          cell,
          event,
          dragId: dragMeta.id,
        });
        const isSameCell = dragMeta.subject === subjectId && dragMeta.status === status;
        const targetIndex = status === "InPro" ? 0 : insertIndexRaw;
        const insertIndex = computeInsertIndex({
          targetIndex,
          dragMeta,
          containerLength: length,
          isSameCell,
        });
        const result = controller.moveTask({ taskId: dragMeta.id, to: { subjectId, status, insertIndex } });
        clearDropPreview();
        app.querySelectorAll(".kanban-card.is-dragging").forEach((card) => card.classList.remove("is-dragging"));
        clearDragGhost();
        dragMeta = null;
        render();
      });
    });
  };

  render();
}

if (typeof document !== "undefined") {
  renderAppShell(document);
}
