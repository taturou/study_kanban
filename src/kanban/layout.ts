import { STATUS_ORDER } from "../status/policy";
import type { Status } from "../domain/types";

export const SUBJECT_WIDTH = 160;
const PRIORITY_WIDTH = 200;
const NARROW_WIDTH = 140;

export const PERFORMANCE_BASELINE = {
  subjects: 14,
  cardsPerCell: 35,
};

export function guardStatusOrder(order: Status[]) {
  if (order.length !== STATUS_ORDER.length) {
    throw new Error("固定ステータスの長さが一致しません");
  }
  const mismatch = order.some((status, idx) => status !== STATUS_ORDER[idx]);
  if (mismatch) {
    throw new Error("固定ステータスの順序は変更できません");
  }
  return STATUS_ORDER;
}

function computeStatusWidths(viewportWidth: number) {
  const available = viewportWidth - SUBJECT_WIDTH;
  const minStatusWidth = PRIORITY_WIDTH;
  const minGroupWidth = 3 * PRIORITY_WIDTH + 3 * NARROW_WIDTH;

  if (available >= STATUS_ORDER.length * minStatusWidth) {
    const equal = Math.floor(available / STATUS_ORDER.length);
    const widths = STATUS_ORDER.map((_, idx) =>
      idx === STATUS_ORDER.length - 1 ? available - equal * (STATUS_ORDER.length - 1) : equal,
    );
    return { widths, horizontal: false, minColumnWidth: minStatusWidth };
  }

  if (available >= minGroupWidth) {
    const widths = STATUS_ORDER.map((_, idx) => (idx === 1 || idx === 2 || idx === 3 ? PRIORITY_WIDTH : NARROW_WIDTH));
    return { widths, horizontal: false, minColumnWidth: NARROW_WIDTH };
  }

  const scale = available / minGroupWidth;
  if (scale >= 0.8) {
    const widths = STATUS_ORDER.map((_, idx) => {
      const base = idx === 1 || idx === 2 || idx === 3 ? PRIORITY_WIDTH : NARROW_WIDTH;
      return Math.floor(base * scale);
    });
    const minCol = Math.floor(NARROW_WIDTH * scale);
    return { widths, horizontal: false, minColumnWidth: minCol };
  }

  const widths = STATUS_ORDER.map((_, idx) => (idx === 1 || idx === 2 || idx === 3 ? PRIORITY_WIDTH : NARROW_WIDTH));
  return { widths, horizontal: true, minColumnWidth: NARROW_WIDTH };
}

export function createKanbanLayoutConfig({ subjects, viewportWidth = Infinity }: { subjects: string[]; viewportWidth?: number }) {
  guardStatusOrder(STATUS_ORDER);
  const { widths, horizontal, minColumnWidth } = computeStatusWidths(viewportWidth);
  const gridTemplate = [SUBJECT_WIDTH, ...widths].map((w) => `${w}px`).join(" ");
  const totalWidth = SUBJECT_WIDTH + widths.reduce((sum, w) => sum + w, 0);
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
      totalWidth,
    },
    scroll: {
      horizontal,
    },
    subjects,
    statuses: STATUS_ORDER,
    performance: PERFORMANCE_BASELINE,
  };
}

export function calculateScrollDuringEmptyDrag({
  current,
  dragDeltaX,
  dragDeltaY,
}: {
  current: { x: number; y: number };
  dragDeltaX: number;
  dragDeltaY: number;
}) {
  const nextX = Math.max(0, current.x + dragDeltaX);
  const nextY = Math.max(0, current.y + dragDeltaY);
  return { x: nextX, y: nextY };
}

export function shouldShowInsertPreview({ subjects, cardsPerCell }: { subjects: number; cardsPerCell: number }) {
  return subjects <= PERFORMANCE_BASELINE.subjects && cardsPerCell <= PERFORMANCE_BASELINE.cardsPerCell;
}
