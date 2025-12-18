export const STATUS_ORDER = ["Backlog", "Today", "InPro", "OnHold", "Done", "WontFix"];
export const SUBJECT_WIDTH = 160;
const PRIORITY_WIDTH = 200;
const NARROW_WIDTH = 140;

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

function computeStatusWidths(viewportWidth) {
  const available = viewportWidth - SUBJECT_WIDTH;
  const minStatusWidth = PRIORITY_WIDTH; // 今日系の最低幅
  const minGroupWidth = 3 * PRIORITY_WIDTH + 3 * NARROW_WIDTH;

  // 十分広い: 均等割り
  if (available >= STATUS_ORDER.length * minStatusWidth) {
    const equal = Math.floor(available / STATUS_ORDER.length);
    const widths = STATUS_ORDER.map((_, idx) =>
      idx === STATUS_ORDER.length - 1 ? available - equal * (STATUS_ORDER.length - 1) : equal,
    );
    return { widths, horizontal: false, minColumnWidth: minStatusWidth };
  }

  // 中間: Today/InPro/OnHold を固定幅、Backlog/Done/WontFix を狭める
  if (available >= minGroupWidth) {
    const widths = STATUS_ORDER.map((status, idx) =>
      idx === 1 || idx === 2 || idx === 3 ? PRIORITY_WIDTH : NARROW_WIDTH,
    );
    return { widths, horizontal: false, minColumnWidth: NARROW_WIDTH };
  }

  // さらに狭い: スケールをかけて調整し、一定未満なら横スクロールを許容
  const scale = available / minGroupWidth;
  if (scale >= 0.8) {
    const widths = STATUS_ORDER.map((status, idx) => {
      const base = idx === 1 || idx === 2 || idx === 3 ? PRIORITY_WIDTH : NARROW_WIDTH;
      return Math.floor(base * scale);
    });
    const minCol = Math.floor(NARROW_WIDTH * scale);
    return { widths, horizontal: false, minColumnWidth: minCol };
  }

  // 極端に狭い: 最低幅で横スクロールを許容
  const widths = STATUS_ORDER.map((status, idx) =>
    idx === 1 || idx === 2 || idx === 3 ? PRIORITY_WIDTH : NARROW_WIDTH,
  );
  return { widths, horizontal: true, minColumnWidth: NARROW_WIDTH };
}

export function createKanbanLayoutConfig({ subjects, viewportWidth = Infinity }) {
  guardStatusOrder(STATUS_ORDER);
  const { widths, horizontal, minColumnWidth } = computeStatusWidths(viewportWidth);
  const gridTemplate = [SUBJECT_WIDTH, ...widths].map((w) => `${w}px`).join(" ");
  return {
    headerFixed: true,
    containerScroll: true,
    pinned: {
      statusColumns: true,
      subjectColumn: false,
    },
    grid: {
      minColumnWidth,
      minCardTitleLength: 10,
      template: gridTemplate,
      subjectWidth: SUBJECT_WIDTH,
      statusWidths: widths,
    },
    scroll: {
      horizontal,
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
