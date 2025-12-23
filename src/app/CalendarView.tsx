import {
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { buildCalendarGrid, getWeekStart } from "../calendar/utils";
import { buildDayViewLists } from "../calendar/dayView";
import { createCalendarService } from "../calendar/service";
import { createInMemoryCalendarAdapter } from "../calendar/inMemoryAdapter";
import type { CalendarEvent } from "../calendar/types";
import { computeSprintRange } from "../sprint/range";
import { useKanbanStore } from "../store/kanbanStore";

const STORAGE_KEY = "lpk.currentSprintId";
const DEFAULT_AVAILABILITY_MINUTES = 120;

const toIsoDate = (value: Date | string) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
};

function loadStoredSprintDate() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  const parsed = new Date(stored);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function storeSprintDate(date: Date) {
  window.localStorage.setItem(STORAGE_KEY, toIsoDate(date));
}

export function CalendarView() {
  const tasks = useKanbanStore((state) => state.tasks);
  const [viewDate, setViewDate] = useState(() => loadStoredSprintDate() ?? new Date());
  const [selectedDate, setSelectedDate] = useState(() => loadStoredSprintDate() ?? new Date());
  const [availabilityOverrides, setAvailabilityOverrides] = useState<Record<string, number>>({});
  const [eventTitle, setEventTitle] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  const calendarService = useMemo(() => {
    const adapter = createInMemoryCalendarAdapter();
    return createCalendarService({ adapter });
  }, []);

  useEffect(() => {
    calendarService.listEvents().then(setEvents);
  }, [calendarService]);

  const sprintRange = useMemo(() => computeSprintRange(selectedDate), [selectedDate]);
  useEffect(() => {
    const weekStart = getWeekStart(selectedDate);
    storeSprintDate(weekStart);
  }, [selectedDate]);

  const grid = useMemo(() => buildCalendarGrid(viewDate), [viewDate]);
  const dayLists = useMemo(
    () =>
      buildDayViewLists({
        tasks,
        date: selectedDate,
        sprintRange,
      }),
    [tasks, selectedDate, sprintRange],
  );

  const selectedIso = toIsoDate(selectedDate);
  const availability = availabilityOverrides[selectedIso] ?? DEFAULT_AVAILABILITY_MINUTES;

  const handleAddEvent = async () => {
    if (!eventTitle.trim()) return;
    const start = new Date(`${selectedIso}T09:00:00.000Z`).toISOString();
    const end = new Date(`${selectedIso}T10:00:00.000Z`).toISOString();
    const result = await calendarService.upsertEvent({
      id: `local-${Date.now()}`,
      title: eventTitle.trim(),
      start,
      end,
      source: "LPK",
    });
    if (!result.ok) {
      setCalendarError("オフラインのため予定を追加できません。オンライン時に再試行してください。");
      return;
    }
    setCalendarError(null);
    setEventTitle("");
    const next = await calendarService.listEvents();
    setEvents(next);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h5">カレンダー</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
          >
            前月
          </Button>
          <Typography variant="subtitle1">
            {viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
          >
            次月
          </Button>
          <Chip label={`スプリント ${toIsoDate(sprintRange.start)} 〜 ${toIsoDate(sprintRange.end)}`} />
        </Stack>
        <Stack spacing={1}>
          {grid.map((week, weekIndex) => (
            <Stack key={weekIndex} direction="row" spacing={1}>
              {week.map((day) => {
                const iso = toIsoDate(day);
                const isSelected = iso === selectedIso;
                return (
                  <Button
                    key={iso}
                    size="small"
                    variant={isSelected ? "contained" : "outlined"}
                    onClick={() => setSelectedDate(day)}
                  >
                    {day.getUTCDate()}
                  </Button>
                );
              })}
            </Stack>
          ))}
        </Stack>
        <Divider />
        <Typography variant="h6">日付ビュー</Typography>
        <Typography variant="body2">選択日: {selectedIso}</Typography>
        <Stack spacing={1}>
          <Typography variant="subtitle2">期日タスク</Typography>
          {dayLists.due.length ? (
            dayLists.due.map((task) => <Typography key={task.id}>{task.title}</Typography>)
          ) : (
            <Typography variant="body2">該当なし</Typography>
          )}
          <Typography variant="subtitle2">期限超過</Typography>
          {dayLists.overdue.length ? (
            dayLists.overdue.map((task) => <Typography key={task.id}>{task.title}</Typography>)
          ) : (
            <Typography variant="body2">該当なし</Typography>
          )}
          <Typography variant="subtitle2">当日追加タスク</Typography>
          {dayLists.added.length ? (
            dayLists.added.map((task) => <Typography key={task.id}>{task.title}</Typography>)
          ) : (
            <Typography variant="body2">該当なし</Typography>
          )}
          <Typography variant="subtitle2">実施タスク</Typography>
          {dayLists.actual.length ? (
            dayLists.actual.map((task) => <Typography key={task.id}>{task.title}</Typography>)
          ) : (
            <Typography variant="body2">該当なし</Typography>
          )}
        </Stack>
        <Divider />
        <Stack spacing={1}>
          <Typography variant="h6">学習可能時間</Typography>
          <TextField
            label="学習可能時間(分)"
            type="number"
            value={availability}
            onChange={(event) => {
              const next = Number.parseInt(event.target.value, 10);
              setAvailabilityOverrides((prev) => ({
                ...prev,
                [selectedIso]: Number.isFinite(next) ? next : DEFAULT_AVAILABILITY_MINUTES,
              }));
            }}
          />
        </Stack>
        <Divider />
        <Stack spacing={1}>
          <Typography variant="h6">予定</Typography>
          <TextField
            label="予定タイトル"
            value={eventTitle}
            onChange={(event) => setEventTitle(event.target.value)}
          />
          <Button variant="contained" onClick={handleAddEvent}>
            予定を追加
          </Button>
          {calendarError ? <Typography color="error">{calendarError}</Typography> : null}
          {events.length ? (
            events.map((event) => (
              <Typography key={event.id}>
                {event.title} ({event.start.slice(0, 10)})
              </Typography>
            ))
          ) : (
            <Typography variant="body2">予定はありません</Typography>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
