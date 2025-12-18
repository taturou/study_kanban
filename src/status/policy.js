export const STATUS_ORDER = ["Backlog", "Today", "InPro", "OnHold", "Done", "WontFix"];

export const POLICY_ERRORS = {
  INVALID_STATUS: "invalid-status",
  TODAY_NOT_TOP: "today-not-top",
  ONHOLD_NOT_TOP: "onhold-not-top",
  INVALID_INPRO_POSITION: "invalid-inpro-position",
  INVALID_DONE_SOURCE: "invalid-done-source",
};

function isValidStatus(status) {
  return STATUS_ORDER.includes(status);
}

export function createStatusPolicy() {
  function validateMove(input) {
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

    const sideEffects = [];

    // 既存 InPro があれば OnHold 先頭へ退避
    if (context.hasOtherInPro && context.inProTaskId) {
      sideEffects.push({ kind: "autoMoveToOnHold", taskId: context.inProTaskId });
      sideEffects.push({ kind: "normalizePriorities", subjectId: context.inProSubjectId ?? from.subjectId, status: "OnHold" });
    }

    return { allowed: true, sideEffects };
  }

  return { validateMove };
}
