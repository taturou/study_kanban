import { Button, Typography } from "@mui/material";
import { useMemo } from "react";
import { useKanbanStore } from "../store/kanbanStore";

export function KanbanHeader() {
  const tasks = useKanbanStore((state) => state.sprintTasks);
  const availability = useKanbanStore((state) => state.availability);
  const triggerPomodoro = useKanbanStore((state) => state.triggerPomodoro);
  const setPomodoroVisible = useKanbanStore((state) => state.setPomodoroVisible);

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
  const pomodoroLabel = "🍅";

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
      <div>
        <Button
          variant="contained"
          className="pomodoro-trigger"
          sx={{
            width: 40,
            height: 40,
            minWidth: 40,
            minHeight: 40,
            padding: 0,
            borderRadius: "999px",
            backgroundColor: "#fff",
            color: "#dc2626",
            border: "1px solid rgba(15, 23, 42, 0.12)",
            boxShadow: "0 6px 12px rgba(15, 23, 42, 0.12)",
            "&:hover": {
              backgroundColor: "#fff",
            },
          }}
          onClick={() => {
            setPomodoroVisible(true);
            triggerPomodoro("start");
          }}
        >
          {pomodoroLabel}
        </Button>
      </div>
    </div>
  );
}
