import { useEffect } from "react";
import { KanbanBoard } from "./KanbanBoard";
import { TaskDialog } from "./TaskDialog";
import { useKanbanStore } from "../store/kanbanStore";

export function KanbanView() {
  const tickTimers = useKanbanStore((state) => state.tickTimers);
  const dialogState = useKanbanStore((state) => state.dialogState);

  useEffect(() => {
    const timer = window.setInterval(() => tickTimers(), 1000);
    return () => window.clearInterval(timer);
  }, [tickTimers]);

  return (
    <>
      <KanbanBoard />
      {dialogState ? <TaskDialog /> : null}
    </>
  );
}
