const STATUSES = ["Backlog", "Today", "Done"];

function cloneTasks(tasks) {
  return {
    Backlog: [...tasks.Backlog],
    Today: [...tasks.Today],
    Done: [...tasks.Done],
  };
}

function nextId(current) {
  return `lab-${current}`;
}

export function createLabState() {
  return {
    tasks: {
      Backlog: [
        {
          id: nextId(1),
          title: "サンプルタスク",
          status: "Backlog",
          subject: "English",
        },
      ],
      Today: [],
      Done: [],
    },
    nextId: 2,
  };
}

export function addTaskToLab(state, title) {
  const trimmed = title?.trim();
  if (!trimmed) return state;
  const tasks = cloneTasks(state.tasks);
  const id = nextId(state.nextId);
  const task = { id, title: trimmed, status: "Backlog", subject: "English" };
  tasks.Backlog = [...tasks.Backlog, task];
  return {
    tasks,
    nextId: state.nextId + 1,
  };
}

export function moveTaskInLab(state, taskId, toStatus) {
  if (!STATUSES.includes(toStatus)) {
    throw new Error("サポートされないステータスです");
  }
  const tasks = cloneTasks(state.tasks);
  const sourceStatus = STATUSES.find((status) => tasks[status].some((t) => t.id === taskId));
  if (!sourceStatus) {
    return state;
  }
  const task = tasks[sourceStatus].find((t) => t.id === taskId);
  tasks[sourceStatus] = tasks[sourceStatus].filter((t) => t.id !== taskId);
  tasks[toStatus] = [...tasks[toStatus], { ...task, status: toStatus }];
  return {
    tasks,
    nextId: state.nextId,
  };
}

export function summarizeLabState(state) {
  return {
    Backlog: state.tasks.Backlog.length,
    Today: state.tasks.Today.length,
    Done: state.tasks.Done.length,
  };
}
