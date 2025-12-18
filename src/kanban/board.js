import { STATUS_ORDER, createKanbanLayoutConfig } from "./layout.js";

function renderHeader(statuses, config) {
  const corner = `<div class="kanban-header__corner" aria-hidden="true" style="width:${config.grid.subjectWidth}px"></div>`;
  const statusCells = statuses
    .map((status, idx) => {
      const width = config.grid.statusWidths?.[idx] ?? config.grid.minColumnWidth;
      return `<div class="kanban-header__cell" style="min-width:${config.grid.minColumnWidth}px;width:${width}px" data-status="${status}">${status}</div>`;
    })
    .join("");
  const headerStyle = `grid-template-columns:${config.grid.template};min-width:${config.grid.totalWidth}px;width:${config.grid.totalWidth}px`;
  const statusColumns = config.grid.statusWidths.map((w) => `${w}px`).join(" ");
  return `<div class="kanban-header" data-header-fixed="${config.headerFixed}" data-pinned-status-columns="${config.pinned.statusColumns}" data-scroll-horizontal="${config.scroll.horizontal}" style="${headerStyle};--lpk-status-columns:${statusColumns}">${corner}<div class="kanban-header__cells">${statusCells}</div></div>`;
}

function renderTasks(tasks) {
  if (!tasks?.length) return "";
  return tasks
    .map(
      (task) =>
        `<div class="kanban-card demo-card" draggable="true" data-task-id="${task.id}" data-status="${task.status}" data-subject="${task.subjectId}"><div class="demo-card__title">${task.title}</div><small class="demo-card__meta">${task.status}</small></div>`,
    )
    .join("");
}

function renderRow(subject, statuses, pinnedSubject, config, tasks) {
  const cells = statuses
    .map((status, idx) => {
      const width = config.grid.statusWidths?.[idx] ?? config.grid.minColumnWidth;
      const cellTasks = tasks?.filter((t) => t.subjectId === subject && t.status === status) ?? [];
      return `<div class="kanban-cell" data-status="${status}" data-subject="${subject}" style="min-width:${config.grid.minColumnWidth}px;width:${width}px">${
        status === "Backlog" ? '<button class="kanban-add" aria-label="Backlog にタスクを追加">＋</button>' : ""
      }<div class="kanban-card placeholder" data-testid="placeholder-card" data-status="${status}" data-subject="${subject}"></div><div class="kanban-cell__tasks">${renderTasks(cellTasks)}</div></div>`;
    })
    .join("");
  const rowStyle = `grid-template-columns:${config.grid.template};min-width:${config.grid.totalWidth}px;width:${config.grid.totalWidth}px`;
  return `<div class="kanban-row" data-subject="${subject}" style="${rowStyle}"><div class="kanban-row__subject" data-pinned-subject-column="${pinnedSubject}" style="width:${config.grid.subjectWidth}px">${subject}</div>${cells}</div>`;
}

/**
 * KanbanBoard のプレースホルダー HTML を返す。
 * グリッド構造とピン留め/スクロール設定を data-* 属性で保持する。
 */
export function renderKanbanBoard({ subjects, layout }) {
  const config = layout ?? createKanbanLayoutConfig({ subjects, viewportWidth: Infinity });
  const statuses = config.statuses ?? STATUS_ORDER;
  const header = renderHeader(statuses, config);
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
