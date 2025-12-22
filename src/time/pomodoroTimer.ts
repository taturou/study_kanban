const MINUTE_MS = 60 * 1000;

type PomodoroNotify = (payload: { type: string; phase: "work" | "break" }) => void;

export function createPomodoroTimer({
  workMinutes = 25,
  breakMinutes = 5,
  now = () => new Date(),
  onNotify = () => {},
}: {
  workMinutes?: number;
  breakMinutes?: number;
  now?: () => Date;
  onNotify?: PomodoroNotify;
} = {}) {
  let state: "idle" | "running" | "paused" = "idle";
  let phase: "work" | "break" = "work";
  let remainingMs = workMinutes * MINUTE_MS;
  let endAt: Date | null = null;

  function notify(type: string) {
    onNotify({ type, phase });
  }

  function getRemainingMs() {
    if (state === "running" && endAt) {
      return Math.max(0, endAt.getTime() - now().getTime());
    }
    return remainingMs;
  }

  function setPhase(nextPhase: "work" | "break") {
    phase = nextPhase;
    remainingMs = (nextPhase === "work" ? workMinutes : breakMinutes) * MINUTE_MS;
    if (state === "running") {
      endAt = new Date(now().getTime() + remainingMs);
    }
  }

  function start() {
    if (state === "running") return;
    if (state === "idle") {
      phase = "work";
      remainingMs = workMinutes * MINUTE_MS;
      notify("pomodoro-started");
    }
    state = "running";
    endAt = new Date(now().getTime() + remainingMs);
  }

  function pause() {
    if (state !== "running") return;
    remainingMs = Math.max(0, (endAt?.getTime() ?? 0) - now().getTime());
    state = "paused";
    endAt = null;
  }

  function reset() {
    state = "idle";
    phase = "work";
    remainingMs = workMinutes * MINUTE_MS;
    endAt = null;
  }

  function tick() {
    if (state !== "running" || !endAt) return;
    if (now() < endAt) return;

    if (phase === "work") {
      notify("pomodoro-finished");
      setPhase("break");
      notify("pomodoro-break-started");
      return;
    }

    notify("pomodoro-break-finished");
    setPhase("work");
    notify("pomodoro-started");
  }

  function updateSettings({ nextWorkMinutes, nextBreakMinutes }: { nextWorkMinutes?: number; nextBreakMinutes?: number } = {}) {
    if (typeof nextWorkMinutes === "number") {
      workMinutes = nextWorkMinutes;
    }
    if (typeof nextBreakMinutes === "number") {
      breakMinutes = nextBreakMinutes;
    }
    if (state === "idle") {
      remainingMs = workMinutes * MINUTE_MS;
    }
  }

  return {
    start,
    pause,
    reset,
    tick,
    updateSettings,
    getSnapshot: () => ({
      state,
      phase,
      remainingMinutes: Math.ceil(getRemainingMs() / MINUTE_MS),
      remainingMs: Math.max(0, getRemainingMs()),
      workMinutes,
      breakMinutes,
    }),
  };
}
