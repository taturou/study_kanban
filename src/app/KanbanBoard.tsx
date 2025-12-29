import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Button } from "@mui/material";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { STATUS_ORDER } from "../status/policy";
import { createKanbanLayoutConfig } from "../kanban/layout";
import { computeInsertIndex } from "../kanban/dnd";
import { useKanbanStore } from "../store/kanbanStore";
import type { Status, Task } from "../domain/types";
import { TCard } from "./TCard";

type DragMeta = { taskId: string; subjectId: string; status: Status; index: number };
type DropTarget = { subjectId: string; status: Status; insertIndex: number };

function useGroupedTasks(tasks: Task[]) {
  return useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      const key = `${task.subjectId}:${task.status}`;
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => b.priority - a.priority);
    }
    return map;
  }, [tasks]);
}

function parseCellId(id: string) {
  const [, subjectId, status] = id.split(":");
  return { subjectId, status: status as Status };
}

export function KanbanBoard() {
  const tasks = useKanbanStore((state) => state.sprintTasks);
  const subjects = useKanbanStore((state) => state.subjects);
  const statusLabels = useKanbanStore((state) => state.statusLabels);
  const moveTask = useKanbanStore((state) => state.moveTask);
  const previewMove = useKanbanStore((state) => state.previewMove);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(() => window.innerWidth);

  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const update = () => setViewportWidth(node.clientWidth || window.innerWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const layout = createKanbanLayoutConfig({ subjects, viewportWidth });
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const grouped = useGroupedTasks(tasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dragMeta, setDragMeta] = useState<DragMeta | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.data.current?.taskId);
    if (task) {
      const cellTasks = grouped.get(`${task.subjectId}:${task.status}`) ?? [];
      const index = cellTasks.findIndex((t) => t.id === task.id);
      setActiveTask(task);
      setDragMeta({ taskId: task.id, subjectId: task.subjectId, status: task.status, index });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setDropTarget(null);
      return;
    }
    const activeId = active.data.current?.taskId as string | undefined;
    if (!activeId) {
      setDropTarget(null);
      return;
    }
    const overType = over.data.current?.type as string | undefined;
    let subjectId = "";
    let status: Status = "Backlog";
    let targetIndex: number | null = null;

    if (overType === "cell") {
      ({ subjectId, status } = parseCellId(over.id as string));
      const cellTasks = grouped.get(`${subjectId}:${status}`) ?? [];
      targetIndex = cellTasks.length;
    }
    if (overType === "card") {
      subjectId = over.data.current?.subjectId;
      status = over.data.current?.status;
      targetIndex = over.data.current?.index ?? null;
    }
    if (!subjectId) {
      setDropTarget(null);
      return;
    }
    const cellTasks = grouped.get(`${subjectId}:${status}`) ?? [];
    const computedIndex = computeInsertIndex({
      targetIndex,
      dragMeta,
      containerLength: cellTasks.length,
      isSameCell: dragMeta?.subjectId === subjectId && dragMeta?.status === status,
    });
    const insertIndex = status === "InPro" ? 0 : computedIndex;
    const decision = previewMove(activeId, { subjectId, status, insertIndex });
    if (!decision.allowed) {
      setDropTarget(null);
      return;
    }
    setDropTarget({ subjectId, status, insertIndex });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setDropTarget(null);
    if (!over) {
      setDragMeta(null);
      return;
    }
    const activeId = active.data.current?.taskId as string | undefined;
    if (!activeId) {
      setDragMeta(null);
      return;
    }
    const overType = over.data.current?.type as string | undefined;
    let subjectId = "";
    let status: Status = "Backlog";
    let targetIndex: number | null = null;

    if (overType === "cell") {
      ({ subjectId, status } = parseCellId(over.id as string));
    }
    if (overType === "card") {
      subjectId = over.data.current?.subjectId;
      status = over.data.current?.status;
      targetIndex = over.data.current?.index ?? null;
    }
    if (!subjectId) {
      setDragMeta(null);
      return;
    }
    const cellTasks = grouped.get(`${subjectId}:${status}`) ?? [];
    const computedIndex = computeInsertIndex({
      targetIndex,
      dragMeta,
      containerLength: cellTasks.length,
      isSameCell: dragMeta?.subjectId === subjectId && dragMeta?.status === status,
    });
    const insertIndex = status === "InPro" ? 0 : computedIndex;
    moveTask(activeId, { subjectId, status, insertIndex });
    setDragMeta(null);
  };

  return (
    <div className="kanban-board__container">
      <div ref={scrollRef} className="kanban-board__scroll" data-scroll-horizontal={layout.scroll.horizontal}>
        <div
          className="kanban-board"
          style={{
            ["--lpk-grid-template" as string]: layout.grid.template,
            ["--lpk-total-width" as string]: `${layout.grid.totalWidth}px`,
            ["--lpk-status-col-min-width" as string]: `${layout.grid.minColumnWidth}px`,
            ["--lpk-subject-col-width" as string]: `${layout.grid.subjectWidth}px`,
            ["--lpk-status-columns" as string]: layout.grid.statusWidths.map((w) => `${w}px`).join(" "),
          }}
        >
          <div className="kanban-header__row">
            <div className="kanban-header__corner" />
            <div className="kanban-header__cells">
              {STATUS_ORDER.map((status) => (
                <div key={status} className="kanban-header__cell">
                  {statusLabels[status]}
                </div>
              ))}
            </div>
          </div>
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
            <div className="kanban-container">
              {subjects.map((subject) => (
                <div key={subject} className="kanban-row">
                  <div className="kanban-subject">{subject}</div>
                  {STATUS_ORDER.map((status) => {
                    const cellTasks = grouped.get(`${subject}:${status}`) ?? [];
                    return (
                      <KanbanCell
                        key={`${subject}-${status}`}
                        subjectId={subject}
                        status={status}
                        tasks={cellTasks}
                        dropTarget={dropTarget}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <DragOverlay>{activeTask ? <TCard task={activeTask} /> : null}</DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
}

function KanbanCell({
  subjectId,
  status,
  tasks,
  dropTarget,
}: {
  subjectId: string;
  status: Status;
  tasks: Task[];
  dropTarget: DropTarget | null;
}) {
  const openNewTaskDialog = useKanbanStore((state) => state.openNewTaskDialog);
  const { setNodeRef } = useDroppableWithData({
    id: `cell:${subjectId}:${status}`,
    data: { type: "cell", subjectId, status },
  });
  const isTarget = dropTarget?.subjectId === subjectId && dropTarget?.status === status;
  const insertIndex = isTarget ? Math.min(dropTarget.insertIndex, tasks.length) : null;
  const renderedTasks: React.ReactNode[] = [];
  for (let i = 0; i <= tasks.length; i += 1) {
    if (insertIndex === i) {
      renderedTasks.push(<div key={`placeholder-${subjectId}-${status}`} className="kanban-cell__placeholder" />);
    }
    if (i < tasks.length) {
      const task = tasks[i];
      renderedTasks.push(<TCard key={task.id} task={task} index={i} />);
    }
  }
  return (
    <div ref={setNodeRef} className="kanban-cell">
      <div className="kanban-cell__tasks">
        {renderedTasks}
        {status === "Backlog" ? (
          <Button variant="outlined" size="small" onClick={() => openNewTaskDialog(subjectId, status)}>
            +
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function useDroppableWithData({ id, data }: { id: string; data: Record<string, unknown> }) {
  return useDroppable({ id, data });
}
