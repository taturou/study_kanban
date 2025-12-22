import { buildCardViewModel } from "../card/tcardView.js";
import { sumActualMinutes } from "../time/timeCalc.js";
import { STATUS_ORDER, createKanbanLayoutConfig } from "./layout.js";

function formatDueLabel(task, viewModel) {
  if (!task?.dueAt) return "期限: 未設定";
  return `期限: ${task.dueAt} (${viewModel.dueWeekday})`;
}

function renderHeader(statuses, config, statusLabels = {}) {
  const corner = `<div class="kanban-header__corner" aria-hidden="true" style="width:${config.grid.subjectWidth}px"></div>`;
  const statusCells = statuses
    .map((status, idx) => {
      const width = config.grid.statusWidths?.[idx] ?? config.grid.minColumnWidth;
      const label = statusLabels[status] ?? status;
      return `<div class="kanban-header__cell" style="min-width:${config.grid.minColumnWidth}px;width:${width}px" data-status="${status}">${label}</div>`;
    })
    .join("");
  const headerStyle = `grid-template-columns:${config.grid.template};min-width:${config.grid.totalWidth}px;width:${config.grid.totalWidth}px`;
  const statusColumns = config.grid.statusWidths.map((w) => `${w}px`).join(" ");
  return `<div class="kanban-header" data-header-fixed="${config.headerFixed}" data-pinned-status-columns="${config.pinned.statusColumns}" data-scroll-horizontal="${config.scroll.horizontal}" style="${headerStyle};--lpk-status-columns:${statusColumns}">${corner}<div class="kanban-header__cells">${statusCells}</div></div>`;
}

function getActualMinutes(task) {
  const pending = task.inProPendingMinutes ?? 0;
  return sumActualMinutes(task) + pending;
}

function renderInProIndicator(task) {
  if (task.status !== "InPro") return "";
  const elapsed = task.inProElapsedMinutes ?? 0;
  const progress = Math.min(1, (elapsed % 60) / 60);
  return `
    <div class="kanban-card__ring" style="--lpk-ring-progress:${progress}">
      <span class="kanban-card__ring-label">${elapsed} min</span>
    </div>
  `;
}

function renderTasks(tasks) {
  if (!tasks?.length) return "";
  return tasks
    .map((task, index) => {
      const viewModel = buildCardViewModel({
        ...task,
        actualMinutes: getActualMinutes(task),
      });
      const shapeClass = viewModel.shape === "square" ? "kanban-card--square" : "kanban-card--rect";
      const dueLabel = formatDueLabel(task, viewModel);
      return `
        <div class="kanban-card ${shapeClass}" draggable="true" data-task-id="${task.id}" data-status="${task.status}" data-subject="${task.subjectId}" data-index="${index}">
          <div class="kanban-card__title">${viewModel.title}</div>
          ${renderInProIndicator(task)}
          <div class="kanban-card__meta">
            <span class="kanban-card__due">${dueLabel}</span>
          </div>
          <div class="kanban-card__gauge">
            <span>予定: ${viewModel.gauge.estimate}</span>
            <span>実績: ${viewModel.gauge.actual}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderRow(subject, statuses, pinnedSubject, config, tasks) {
  const cells = statuses
    .map((status, idx) => {
      const width = config.grid.statusWidths?.[idx] ?? config.grid.minColumnWidth;
      const cellTasks = tasks?.filter((t) => t.subjectId === subject && t.status === status) ?? [];
      return `<div class="kanban-cell" data-status="${status}" data-subject="${subject}" style="min-width:${config.grid.minColumnWidth}px;width:${width}px">${
        status === "Backlog" ? '<button class="kanban-add" aria-label="Backlog にタスクを追加">＋</button>' : ""
      }<div class="kanban-cell__tasks">${renderTasks(cellTasks)}</div></div>`;
    })
    .join("");
  const rowStyle = `grid-template-columns:${config.grid.template};min-width:${config.grid.totalWidth}px;width:${config.grid.totalWidth}px`;
  return `<div class="kanban-row" data-subject="${subject}" style="${rowStyle}"><div class="kanban-row__subject" data-pinned-subject-column="${pinnedSubject}" style="width:${config.grid.subjectWidth}px">${subject}</div>${cells}</div>`;
}

/**
 * KanbanBoard のプレースホルダー HTML を返す。
 * グリッド構造とピン留め/スクロール設定を data-* 属性で保持する。
 */
export function renderKanbanBoard({ subjects, layout, statusLabels }) {
  const config = layout ?? createKanbanLayoutConfig({ subjects, viewportWidth: Infinity });
  const statuses = config.statuses ?? STATUS_ORDER;
  const labels = layout?.statusLabels ?? statusLabels ?? {};
  const header = renderHeader(statuses, config, labels);
  const rows = subjects.map((subject) => renderRow(subject, statuses, config.pinned.subjectColumn, config, layout?.tasks ?? [])).join("");
  const statusColumns = config.grid.statusWidths.map((w) => `${w}px`).join(" ");
  const boardStyle = [
    `--lpk-grid-template:${config.grid.template}`,
    `--lpk-status-col-min-width:${config.grid.minColumnWidth}px`,
    `--lpk-subject-col-width:${config.grid.subjectWidth}px`,
    `--lpk-total-width:${config.grid.totalWidth}px`,
    `--lpk-status-columns:${statusColumns}`,
    `min-width:${config.grid.totalWidth}px`,
    `width:${config.grid.totalWidth}px`,
  ].join(";");
  return `<section class="kanban-board" data-testid="kanban-board" data-scroll-horizontal="${config.scroll.horizontal}" data-scroll-vertical="true" style="${boardStyle}">${header}<div class="kanban-container" data-testid="kanban-container" data-pinned-subject-column="${config.pinned.subjectColumn}">${rows}</div></section>`;
}
