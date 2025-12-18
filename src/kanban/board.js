import { STATUS_ORDER, createKanbanLayoutConfig } from "./layout.js";

function renderHeader(statuses, config) {
  const corner = `<div class="kanban-header__corner" aria-hidden="true" style="width:${config.grid.subjectWidth}px"></div>`;
  const statusCells = statuses
    .map(
      (status) =>
        `<div class="kanban-header__cell" style="min-width:${config.grid.minColumnWidth}px;width:${config.grid.statusWidths?.[statuses.indexOf(status)] ?? config.grid.minColumnWidth}px" data-status="${status}">${status}</div>`,
    )
    .join("");
  return `<div class="kanban-header" data-header-fixed="${config.headerFixed}" data-pinned-status-columns="${config.pinned.statusColumns}" data-scroll-horizontal="${config.scroll.horizontal}" style="grid-template-columns:${config.grid.template}">${corner}<div class="kanban-header__cells">${statusCells}</div></div>`;
}

function renderRow(subject, statuses, pinnedSubject, config) {
  const cells = statuses
    .map(
      (status) =>
        `<div class="kanban-cell" data-status="${status}" data-subject="${subject}">${
          status === "Backlog" ? '<button class="kanban-add" aria-label="Backlog にタスクを追加">＋</button>' : ""
        }<div class="kanban-card placeholder" data-testid="placeholder-card" data-status="${status}" data-subject="${subject}"></div></div>`,
    )
    .join("");
  return `<div class="kanban-row" data-subject="${subject}" style="grid-template-columns:${config.grid.template}"><div class="kanban-row__subject" data-pinned-subject-column="${pinnedSubject}" style="width:${config.grid.subjectWidth}px">${subject}</div>${cells}</div>`;
}

/**
 * KanbanBoard のプレースホルダー HTML を返す。
 * グリッド構造とピン留め/スクロール設定を data-* 属性で保持する。
 */
export function renderKanbanBoard({ subjects, layout }) {
  const config = layout ?? createKanbanLayoutConfig({ subjects, viewportWidth: Infinity });
  const statuses = config.statuses ?? STATUS_ORDER;
  const header = renderHeader(statuses, config);
  const rows = subjects.map((subject) => renderRow(subject, statuses, config.pinned.subjectColumn, config)).join("");
  return `<section class="kanban-board" data-testid="kanban-board" data-scroll-horizontal="${config.scroll.horizontal}" data-scroll-vertical="true">${header}<div class="kanban-container" data-testid="kanban-container" data-pinned-subject-column="${config.pinned.subjectColumn}">${rows}</div></section>`;
}
