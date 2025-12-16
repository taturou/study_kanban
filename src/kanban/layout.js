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

export function createKanbanLayoutConfig({ subjects }) {
  guardStatusOrder(STATUS_ORDER);
  return {
    headerFixed: true,
    containerScroll: true,
    pinned: {
      statusColumns: true,
      subjectColumn: true,
    },
    grid: {
      minColumnWidth: 240,
      minCardTitleLength: 10,
    },
    subjects,
    statuses: STATUS_ORDER,
    performance: PERFORMANCE_BASELINE,
  };
}
