export const SUBJECT_DELETE_BLOCK_MESSAGE = "タスクがある教科は削除できません";

function assertArray(value: unknown, name: string) {
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be array`);
  }
}

export function createSubjectsManager() {
  const orderBySprint = new Map<string, string[]>();

  function setOrder(sprintId: string, order: string[]) {
    assertArray(order, "order");
    orderBySprint.set(sprintId, [...order]);
    return getOrder(sprintId);
  }

  function getOrder(sprintId: string) {
    const order = orderBySprint.get(sprintId);
    return order ? [...order] : [];
  }

  function deleteSubject(sprintId: string, subjectId: string, tasksBySubject: Record<string, unknown[]>) {
    const tasks = tasksBySubject?.[subjectId] ?? [];
    if (tasks.length > 0) {
      throw new Error(SUBJECT_DELETE_BLOCK_MESSAGE);
    }
    const order = orderBySprint.get(sprintId) ?? [];
    const next = order.filter((id) => id !== subjectId);
    orderBySprint.set(sprintId, next);
    return next;
  }

  return {
    setOrder,
    getOrder,
    deleteSubject,
  };
}
