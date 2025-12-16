export const STATUS_ORDER = ["Backlog", "Today", "InPro", "OnHold", "Done", "WontFix"];

export const PERFORMANCE_BASELINE = {
  subjects: 14,
  cardsPerCell: 35,
};

export function guardStatusOrder(order) {
  if (order.length !== STATUS_ORDER.length) {
    throw new Error("固定ステータスの長さが一致しません");
  }
  const mismatch = order.some((status, idx) => status !== STATUS_ORDER[idx]);
  if (mismatch) {
    throw new Error("固定ステータスの順序は変更できません");
  }
  return STATUS_ORDER;
}

export function createKanbanLayoutConfig({ subjects, viewportWidth = Infinity }) {
  guardStatusOrder(STATUS_ORDER);
  const minColumnWidth = 240;
  const needHorizontalScroll = STATUS_ORDER.length * minColumnWidth > viewportWidth;
  return {
    headerFixed: true,
    containerScroll: true,
    pinned: {
      statusColumns: true,
      subjectColumn: true,
    },
    grid: {
      minColumnWidth,
      minCardTitleLength: 10,
    },
    scroll: {
      horizontal: needHorizontalScroll,
    },
    subjects,
    statuses: STATUS_ORDER,
    performance: PERFORMANCE_BASELINE,
  };
}

export function calculateScrollDuringEmptyDrag({ current, dragDeltaX, dragDeltaY }) {
  const nextX = Math.max(0, current.x + dragDeltaX);
  const nextY = Math.max(0, current.y + dragDeltaY);
  return { x: nextX, y: nextY };
}

export function shouldShowInsertPreview({ subjects, cardsPerCell }) {
  return subjects <= PERFORMANCE_BASELINE.subjects && cardsPerCell <= PERFORMANCE_BASELINE.cardsPerCell;
}
