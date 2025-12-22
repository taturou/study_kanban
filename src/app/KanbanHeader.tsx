import { Button, Typography } from "@mui/material";
import { useMemo } from "react";
import { useKanbanStore } from "../store/kanbanStore";

export function KanbanHeader() {
  const tasks = useKanbanStore((state) => state.tasks);
  const availability = useKanbanStore((state) => state.availability);

  const { todayCount, doneCount } = useMemo(() => {
    let today = 0;
    let done = 0;
    for (const task of tasks) {
      if (task.status === "Today") today += 1;
      if (task.status === "Done") done += 1;
    }
    return { todayCount: today, doneCount: done };
  }, [tasks]);

  const gaugePercent = Math.min(100, Math.max(0, availability.ratio * 100));

  return (
    <div className="kanban-header">
      <div>
        <Typography variant="subtitle2">Today {todayCount} / Done {doneCount}</Typography>
        <div className="kanban-header__meta">
          <span>残り {availability.remainingMinutes} 分</span>
          <span>予定 {availability.availableMinutes} 分</span>
        </div>
      </div>
      <div className="kanban-header__gauge">
        <Typography variant="caption">残り学習可能時間</Typography>
        <div className="gauge-bar">
          <span className="gauge-bar__fill" style={{ width: `${gaugePercent}%` }} />
        </div>
      </div>
      <Button variant="contained">Pomodoro Start</Button>
    </div>
  );
}
