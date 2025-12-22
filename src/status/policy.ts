import type { Status } from "../domain/types";

export const STATUS_ORDER: Status[] = ["Backlog", "Today", "InPro", "OnHold", "Done", "WontFix"];

export const POLICY_ERRORS = {
  INVALID_STATUS: "invalid-status",
  TODAY_NOT_TOP: "today-not-top",
  ONHOLD_NOT_TOP: "onhold-not-top",
  INVALID_INPRO_POSITION: "invalid-inpro-position",
  INVALID_DONE_SOURCE: "invalid-done-source",
} as const;

type PolicyError = (typeof POLICY_ERRORS)[keyof typeof POLICY_ERRORS];

type MoveContext = {
  hasOtherInPro: boolean;
  inProTaskId?: string;
  inProSubjectId?: string;
  isTopOfToday: boolean;
  isTopOfOnHold: boolean;
};

type MoveSideEffect =
  | { kind: "autoMoveToOnHold"; taskId: string }
  | { kind: "normalizePriorities"; subjectId: string; status: Status };

type MoveInput = {
  taskId: string;
  from: { subjectId: string; status: Status; priority: number };
  to: { subjectId: string; status: Status; insertIndex?: number };
  context: MoveContext;
};

type MoveDecision =
  | { allowed: true; sideEffects: MoveSideEffect[] }
  | { allowed: false; reason: PolicyError };

function isValidStatus(status: Status) {
  return STATUS_ORDER.includes(status);
}

export function createStatusPolicy() {
  function validateMove(input: MoveInput): MoveDecision {
    const { from, to, context } = input;

    if (!isValidStatus(from.status) || !isValidStatus(to.status)) {
      return { allowed: false, reason: POLICY_ERRORS.INVALID_STATUS };
    }

    // Done は InPro/OnHold からのみ
    if (to.status === "Done" && from.status !== "InPro" && from.status !== "OnHold") {
      return { allowed: false, reason: POLICY_ERRORS.INVALID_DONE_SOURCE };
    }

    if (to.status !== "InPro") {
      return { allowed: true, sideEffects: [] };
    }

    // InPro へ入る場合は insertIndex=0 限定
    if (to.insertIndex !== undefined && to.insertIndex !== 0) {
      return { allowed: false, reason: POLICY_ERRORS.INVALID_INPRO_POSITION };
    }

    // Today→InPro は Today 先頭のみ
    if (from.status === "Today" && !context.isTopOfToday) {
      return { allowed: false, reason: POLICY_ERRORS.TODAY_NOT_TOP };
    }

    // OnHold→InPro は OnHold 先頭のみ
    if (from.status === "OnHold" && !context.isTopOfOnHold) {
      return { allowed: false, reason: POLICY_ERRORS.ONHOLD_NOT_TOP };
    }

    const sideEffects: MoveSideEffect[] = [];

    // 既存 InPro があれば OnHold 先頭へ退避
    if (context.hasOtherInPro && context.inProTaskId) {
      sideEffects.push({ kind: "autoMoveToOnHold", taskId: context.inProTaskId });
      sideEffects.push({
        kind: "normalizePriorities",
        subjectId: context.inProSubjectId ?? from.subjectId,
        status: "OnHold",
      });
    }

    return { allowed: true, sideEffects };
  }

  return { validateMove };
}
