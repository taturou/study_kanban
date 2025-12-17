export const SUBJECT_DELETE_BLOCK_MESSAGE = "タスクがある教科は削除できません";

function assertArray(value, name) {
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be array`);
  }
}

export function createSubjectsManager() {
  const orderBySprint = new Map();

  function setOrder(sprintId, order) {
    assertArray(order, "order");
    orderBySprint.set(sprintId, [...order]);
    return getOrder(sprintId);
  }

  function getOrder(sprintId) {
    const order = orderBySprint.get(sprintId);
    return order ? [...order] : [];
  }

  function deleteSubject(sprintId, subjectId, tasksBySubject) {
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
