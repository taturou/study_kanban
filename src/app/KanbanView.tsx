import { useEffect } from "react";
import { KanbanBoard } from "./KanbanBoard";
import { TaskDialog } from "./TaskDialog";
import { useKanbanStore } from "../store/kanbanStore";
import { Button } from "@mui/material";

export function KanbanView() {
  const tickTimers = useKanbanStore((state) => state.tickTimers);
  const dialogState = useKanbanStore((state) => state.dialogState);
  const pomodoro = useKanbanStore((state) => state.pomodoro);
  const triggerPomodoro = useKanbanStore((state) => state.triggerPomodoro);
  const pomodoroVisible = useKanbanStore((state) => state.pomodoroVisible);
  const setPomodoroVisible = useKanbanStore((state) => state.setPomodoroVisible);
  const overlayKey = useKanbanStore((state) => `${state.pomodoroVisible}-${state.pomodoro.state}`);
  const disableAutoTick = import.meta.env.MODE === "test" || import.meta.env.VITEST;

  useEffect(() => {
    if (disableAutoTick) return;
    const timer = window.setInterval(() => tickTimers(), 1000);
    return () => window.clearInterval(timer);
  }, [tickTimers, disableAutoTick]);

  useEffect(() => {
    if (pomodoro.state === "running") {
      setPomodoroVisible(true);
    }
    if (pomodoro.state === "idle") {
      setPomodoroVisible(false);
    }
  }, [pomodoro.state, setPomodoroVisible]);

  const totalMinutes = pomodoro.phase === "work" ? pomodoro.workMinutes : pomodoro.breakMinutes;
  const totalMs = totalMinutes * 60 * 1000;
  const remainingMs = pomodoro.remainingMs ?? pomodoro.remainingMinutes * 60 * 1000;
  const elapsedMs = Math.max(0, totalMs - remainingMs);
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const totalSeconds = totalMs / 1000;
  const elapsedSeconds = elapsedMs / 1000;
  const stepCount = totalSeconds > 0 ? Math.ceil(totalSeconds / 10) : 1;
  const stepped = Math.floor(elapsedSeconds / 10);
  const progress = stepCount > 0 ? Math.min(stepped / stepCount, 1) : 0;
  const phaseLabel = pomodoro.phase === "work" ? "集中タイム" : "休憩タイム";

  return (
    <>
      <KanbanBoard />
      {pomodoroVisible ? (
        <div
          key={overlayKey}
          className={`pomodoro-overlay ${pomodoro.phase === "work" ? "is-work" : "is-break"}`}
        >
          <div className="pomodoro-overlay__panel">
            <div className="pomodoro-overlay__title">Pomodoro</div>
            <div className="pomodoro-overlay__badge">{phaseLabel}</div>
            <div className="pomodoro-overlay__timebar">
              <div className="pomodoro-overlay__timebar-fill" style={{ width: `${progress * 100}%` }} />
              <div className="pomodoro-overlay__time">{pomodoro.remainingMinutes} min</div>
            </div>
            <div className="pomodoro-overlay__meta">
              <span>経過 {elapsedMinutes} 分</span>
              <span>合計 {totalMinutes} 分</span>
            </div>
            <div className="pomodoro-overlay__actions">
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  triggerPomodoro("pause");
                  setPomodoroVisible(false);
                }}
              >
                停止
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  triggerPomodoro("reset");
                  setPomodoroVisible(false);
                }}
              >
                リセット
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {dialogState ? <TaskDialog /> : null}
    </>
  );
}
