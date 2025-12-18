import { addTaskToLab, createLabState, moveTaskInLab, summarizeLabState } from "./labState.js";

function renderTaskList(tasks, status) {
  return tasks
    .map(
      (task) => `
      <div class="lab-card" data-testid="lab-card" data-status="${status}" data-task-id="${task.id}" draggable="true">
        <span class="lab-card__title">${task.title}</span>
        <span class="lab-card__meta">${status}</span>
      </div>
    `,
    )
    .join("");
}

export function renderMcpLabHtml(state) {
  const summary = summarizeLabState(state);
  return `
    <div class="mcp-lab__controls">
      <label class="lab-input">
        <span>タスク名</span>
        <input type="text" data-testid="lab-task-input" placeholder="AI が入力します" value="MCP 追加タスク" />
      </label>
      <button type="button" data-testid="lab-create-button">タスク追加</button>
      <div class="lab-status" data-testid="lab-status">
        Backlog: ${summary.Backlog} / Today: ${summary.Today} / Done: ${summary.Done}
      </div>
    </div>
    <div class="mcp-lab__board">
      <div class="lab-column" data-testid="lab-backlog" data-status="Backlog">
        <div class="lab-column__header">Backlog</div>
        <div class="lab-column__list" data-testid="lab-backlog-list" data-has-card="${summary.Backlog > 0}">
          ${renderTaskList(state.tasks.Backlog, "Backlog")}
        </div>
      </div>
      <div class="lab-column" data-testid="lab-today" data-status="Today">
        <div class="lab-column__header">Today</div>
        <div class="lab-column__list" data-testid="lab-today-list" data-has-card="${summary.Today > 0}">
          ${renderTaskList(state.tasks.Today, "Today")}
        </div>
      </div>
      <div class="lab-column" data-testid="lab-done" data-status="Done">
        <div class="lab-column__header">Done</div>
        <div class="lab-column__list" data-testid="lab-done-list" data-has-card="${summary.Done > 0}">
          ${renderTaskList(state.tasks.Done, "Done")}
        </div>
      </div>
    </div>
  `;
}

function attachDnD(labRoot, getState, setState) {
  let draggingId = null;
  labRoot.querySelectorAll('[data-testid^="lab-"][data-task-id]').forEach((el) => {
    el.addEventListener("dragstart", (e) => {
      draggingId = el.dataset.taskId;
      e.dataTransfer?.setData("text/plain", draggingId);
    });
  });

  const droppables = labRoot.querySelectorAll(".lab-column__list");
  droppables.forEach((dropZone) => {
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.dataset.dragOver = "true";
    });
    dropZone.addEventListener("dragleave", () => {
      dropZone.dataset.dragOver = "false";
    });
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.dataset.dragOver = "false";
      const id = draggingId ?? e.dataTransfer?.getData("text/plain");
      if (!id) return;
      const status = dropZone.parentElement?.dataset.status;
      if (!status) return;
      const next = moveTaskInLab(getState(), id, status);
      setState(next);
    });
  });
}

export function setupMcpLab(doc) {
  const lab = doc.querySelector('[data-testid="mcp-lab"]');
  if (!lab) return;
  let state = createLabState();

  const render = () => {
    lab.innerHTML = renderMcpLabHtml(state);
    const input = lab.querySelector('[data-testid="lab-task-input"]');
    const button = lab.querySelector('[data-testid="lab-create-button"]');
    button?.addEventListener("click", () => {
      const value = input?.value ?? "";
      state = addTaskToLab(state, value);
      render();
    });
    attachDnD(lab, () => state, (next) => {
      state = next;
      render();
    });
  };

  render();
}

export function initialLabHtml() {
  return renderMcpLabHtml(createLabState());
}
