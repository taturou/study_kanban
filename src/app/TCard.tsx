import { useMemo } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { buildCardViewModel } from "../card/tcardView";
import { useKanbanStore } from "../store/kanbanStore";
import type { Task } from "../domain/types";

type TCardProps = {
  task: Task;
  index?: number;
};

export function TCard({ task, index }: TCardProps) {
  const openEditTaskDialog = useKanbanStore((state) => state.openEditTaskDialog);
  const vm = useMemo(() => buildCardViewModel(task), [task]);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task:${task.id}`,
    data: { type: "task", taskId: task.id, subjectId: task.subjectId, status: task.status, index },
  });
  const { setNodeRef: setDropRef } = useDroppable({
    id: `card:${task.id}`,
    data: { type: "card", taskId: task.id, subjectId: task.subjectId, status: task.status, index },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.6 : 1,
      }
    : undefined;

  const setRefs = (node: HTMLElement | null) => {
    setNodeRef(node);
    setDropRef(node);
  };

  const inProMinutes = task.inProElapsedMinutes ?? 0;
  const actualWithInPro = task.status === "InPro" ? vm.gauge.actual + inProMinutes : vm.gauge.actual;
  const gaugeRatio = vm.gauge.estimate > 0 ? Math.min(actualWithInPro / vm.gauge.estimate, 1) : 0;
  const ringMinutes = ((inProMinutes % 60) + 60) % 60;
  const ringRatio = ringMinutes / 60;

  return (
    <div
      ref={setRefs}
      className="kanban-card"
      data-shape={vm.shape}
      style={style}
      onClick={() => {
        if (!isDragging) {
          openEditTaskDialog(task.id);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          openEditTaskDialog(task.id);
        }
      }}
      role="button"
      tabIndex={0}
      {...listeners}
      {...attributes}
    >
      <div className="kanban-card__title">{vm.title}</div>
      {task.status === "InPro" ? (
        <div className="kanban-card__ring" style={{ ["--lpk-ring-progress" as string]: ringRatio }}>
          <span>{inProMinutes} min</span>
        </div>
      ) : null}
      <div className="kanban-card__meta">
        <span>{vm.dueWeekday ? `期日(${vm.dueWeekday})` : ""}</span>
        <span>
          {actualWithInPro}/{vm.gauge.estimate}m
        </span>
      </div>
      <div className="kanban-card__gauge">
        <span style={{ width: `${gaugeRatio * 100}%` }} />
      </div>
    </div>
  );
}
