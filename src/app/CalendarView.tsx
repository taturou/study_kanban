import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import { ja } from "date-fns/locale";
import { eachDayOfInterval, endOfWeek, format, startOfWeek } from "date-fns";
import { DateCalendar, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { createCalendarService } from "../calendar/service";
import { createInMemoryCalendarAdapter } from "../calendar/inMemoryAdapter";
import type { CalendarEvent } from "../calendar/types";
import { useKanbanStore } from "../store/kanbanStore";
import {
  buildMassiveAvailabilityOverrides,
  buildMassiveSeedEvents,
  isMassiveSeedEnabled,
  MASSIVE_SPRINT_START,
} from "../seed/massiveSeed";

const STORAGE_KEY = "lpk.currentSprintId";
const DEFAULT_AVAILABILITY_MINUTES = 120;

const JST_OFFSET_MINUTES = 9 * 60;

const toIsoDate = (value: Date | string, offsetMinutes = JST_OFFSET_MINUTES) => {
  const date = typeof value === "string" ? new Date(value) : value;
  const shifted = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
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

function formatMinutesAsHours(value: number) {
  const hours = value / 60;
  return hours.toFixed(1);
}

function parseHoursToMinutes(value: string) {
  const hours = Number.parseFloat(value);
  if (!Number.isFinite(hours)) return null;
  return Math.max(0, Math.round(hours * 60));
}

function buildEventsByDate(events: CalendarEvent[]) {
  return events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    const key = toIsoDate(event.start);
    acc[key] = acc[key] ? [...acc[key], event] : [event];
    return acc;
  }, {});
}

export function CalendarView() {
  const theme = useTheme();
  const showMonthCalendar = useMediaQuery(theme.breakpoints.up("lg"));
  const tasks = useKanbanStore((state) => state.tasks);
  const massiveSeedEnabled = isMassiveSeedEnabled();
  const massiveSeedDate = useMemo(
    () => (massiveSeedEnabled ? new Date(`${MASSIVE_SPRINT_START}T00:00:00.000Z`) : null),
    [massiveSeedEnabled],
  );
  const [selectedDate, setSelectedDate] = useState(
    () => massiveSeedDate ?? loadStoredSprintDate() ?? new Date(),
  );
  const [availabilityOverrides, setAvailabilityOverrides] = useState<Record<string, number>>(
    () =>
      massiveSeedDate
        ? buildMassiveAvailabilityOverrides(massiveSeedDate, DEFAULT_AVAILABILITY_MINUTES)
        : {},
  );
  const [eventTitle, setEventTitle] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const calendarService = useMemo(() => {
    const seedDate = massiveSeedDate ?? new Date();
    const adapter = createInMemoryCalendarAdapter(
      massiveSeedEnabled ? buildMassiveSeedEvents(seedDate) : [],
    );
    return createCalendarService({ adapter });
  }, [massiveSeedDate, massiveSeedEnabled]);

  useEffect(() => {
    calendarService.listEvents().then(setEvents);
  }, [calendarService]);

  useEffect(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    storeSprintDate(weekStart);
  }, [selectedDate]);

  useEffect(() => {
    if (!massiveSeedEnabled || !massiveSeedDate) return;
    setAvailabilityOverrides(
      buildMassiveAvailabilityOverrides(massiveSeedDate, DEFAULT_AVAILABILITY_MINUTES),
    );
  }, [massiveSeedDate, massiveSeedEnabled]);

  const weekDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
      }),
    [selectedDate],
  );

  const eventsByDate = useMemo(() => buildEventsByDate(events), [events]);
  const availabilityByDate = useMemo(
    () =>
      weekDays.reduce<Record<string, number>>((acc, day) => {
        const iso = toIsoDate(day);
        acc[iso] = availabilityOverrides[iso] ?? DEFAULT_AVAILABILITY_MINUTES;
        return acc;
      }, {}),
    [availabilityOverrides, weekDays],
  );

  const plannedByDate = useMemo(() => {
    return weekDays.reduce<Record<string, number>>((acc, day) => {
      const iso = toIsoDate(day);
      const planned = tasks.reduce((sum, task) => {
        if (!task.dueAt) return sum;
        return toIsoDate(task.dueAt) === iso ? sum + (task.estimateMinutes ?? 0) : sum;
      }, 0);
      acc[iso] = planned;
      return acc;
    }, {});
  }, [tasks, weekDays]);

  const actualByDate = useMemo(() => {
    return weekDays.reduce<Record<string, number>>((acc, day) => {
      const iso = toIsoDate(day);
      const actual = tasks.reduce((sum, task) => {
        const minutes = (task.actuals ?? [])
          .filter((actualItem) => actualItem.at === iso)
          .reduce((sub, actualItem) => sub + (actualItem.minutes ?? 0), 0);
        return sum + minutes;
      }, 0);
      acc[iso] = actual;
      return acc;
    }, {});
  }, [tasks, weekDays]);

  const selectedIso = toIsoDate(selectedDate);
  const availability = availabilityByDate[selectedIso] ?? DEFAULT_AVAILABILITY_MINUTES;
  const plannedTotal = weekDays.reduce((sum, day) => sum + (plannedByDate[toIsoDate(day)] ?? 0), 0);
  const actualTotal = weekDays.reduce((sum, day) => sum + (actualByDate[toIsoDate(day)] ?? 0), 0);
  const availableTotal = weekDays.reduce((sum, day) => sum + (availabilityByDate[toIsoDate(day)] ?? 0), 0);
  const planGap = plannedTotal - availableTotal;
  const maxValue = Math.max(
    1,
    ...weekDays.map((day) => {
      const key = toIsoDate(day);
      return Math.max(availabilityByDate[key] ?? 0, plannedByDate[key] ?? 0, actualByDate[key] ?? 0);
    }),
  );

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

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekLabel = `${format(weekStart, "yyyy/MM/dd", { locale: ja })} - ${format(weekEnd, "MM/dd", { locale: ja })}`;

  const dailyGap = (plannedByDate[selectedIso] ?? 0) - availability;
  const dailyOver = dailyGap > 0;
  const layoutColumns = showMonthCalendar
    ? "minmax(240px, 320px) minmax(0, 1fr) minmax(260px, 360px)"
    : { xs: "1fr", md: "minmax(0, 1fr) minmax(260px, 360px)" };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: { xs: "100%", xl: 1440 },
        mx: "auto",
        px: { xs: 1, md: 2 },
        flex: 1,
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gap: 1.25,
        minHeight: 0,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 1.25,
          borderRadius: 2,
          border: "1px solid #0f172a",
          background: "#0b1222",
          color: "#e2e8f0",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 7 * 86400000))}
              sx={{ color: "#e2e8f0", borderColor: "rgba(226, 232, 240, 0.4)" }}
              variant="outlined"
            >
              ◀
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={() => setCalendarOpen(true)}
              sx={{ color: "#e2e8f0", fontWeight: 700 }}
            >
              {weekLabel}
            </Button>
            <Button
              size="small"
              onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 7 * 86400000))}
              sx={{ color: "#e2e8f0", borderColor: "rgba(226, 232, 240, 0.4)" }}
              variant="outlined"
            >
              ▶
            </Button>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="caption">合計可能: {formatMinutesAsHours(availableTotal)} h</Typography>
            <Typography variant="caption">計画: {formatMinutesAsHours(plannedTotal)} h</Typography>
            <Typography variant="caption">実績: {formatMinutesAsHours(actualTotal)} h</Typography>
            <Chip
              size="small"
              label={`状態: ${planGap > 0 ? "⚠" : "OK"} ${formatMinutesAsHours(planGap)} h`}
              sx={{
                background: planGap > 0 ? "rgba(248, 113, 113, 0.2)" : "rgba(56, 189, 248, 0.2)",
                color: "#e2e8f0",
                border: "1px solid rgba(226, 232, 240, 0.3)",
              }}
            />
          </Stack>
        </Stack>
      </Paper>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: layoutColumns,
          gap: 1.5,
          alignItems: "stretch",
          minHeight: 0,
        }}
      >
        {showMonthCalendar ? (
          <Paper
            elevation={0}
            sx={{
              p: 1.25,
              borderRadius: 2,
              border: "1px solid #d5deea",
              background: "#f8fafc",
              alignSelf: "start",
            }}
          >
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                月カレンダー
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
                <DateCalendar
                  value={selectedDate}
                  onChange={(value) => {
                    if (!value) return;
                    setSelectedDate(value);
                  }}
                  showDaysOutsideCurrentMonth
                />
              </LocalizationProvider>
            </Stack>
          </Paper>
        ) : null}
        <Paper
          elevation={0}
          sx={{
            p: 1.25,
            borderRadius: 2,
            border: "1px solid #d5deea",
            background: "#f8fafc",
            height: "100%",
          }}
        >
          <Stack spacing={1.25}>
            <Stack spacing={0.5}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                学習可能時間（h）を日別に入力します。
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gap: { xs: 0.5, sm: 1 },
                  alignItems: "center",
                }}
              >
                {weekDays.map((day) => {
                  const iso = toIsoDate(day);
                  const minutes = availabilityByDate[iso] ?? DEFAULT_AVAILABILITY_MINUTES;
                  return (
                    <TextField
                      key={iso}
                      label={format(day, "E", { locale: ja })}
                      size="small"
                      type="number"
                      inputProps={{ step: 0.5, min: 0 }}
                      value={formatMinutesAsHours(minutes)}
                      onChange={(event) => {
                        const nextMinutes = parseHoursToMinutes(event.target.value);
                        setAvailabilityOverrides((prev) => ({
                          ...prev,
                          [iso]: nextMinutes ?? DEFAULT_AVAILABILITY_MINUTES,
                        }));
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              h
                            </Typography>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ background: "#ffffff" }}
                    />
                  );
                })}
              </Box>
            </Stack>
            <Divider />
            <Stack spacing={0.5}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                各日の学習可能・計画・実績を棒で比較します。
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 10, height: 10, borderRadius: 0.5, background: "#e2e8f0" }} />
                  <Typography variant="caption">可能</Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 10, height: 10, borderRadius: 0.5, background: "#38bdf8" }} />
                  <Typography variant="caption">計画</Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 10, height: 10, borderRadius: 0.5, background: "#0f172a" }} />
                  <Typography variant="caption">実績</Typography>
                </Stack>
              </Stack>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gap: { xs: 0.5, sm: 1 },
                  alignItems: "end",
                  minHeight: 260,
                }}
              >
              {weekDays.map((day) => {
                const iso = toIsoDate(day);
                const availableMinutes = availabilityByDate[iso] ?? 0;
                const plannedMinutes = plannedByDate[iso] ?? 0;
                const actualMinutes = actualByDate[iso] ?? 0;
                const availableHeight = (availableMinutes / maxValue) * 220;
                const plannedHeight = (plannedMinutes / maxValue) * 220;
                const actualHeight = (actualMinutes / maxValue) * 220;
                const labelMinHeight = 18;
                const isSelected = iso === selectedIso;
                return (
                  <Stack
                    key={iso}
                    spacing={0.5}
                    alignItems="center"
                    onClick={() => setSelectedDate(day)}
                    sx={{
                      cursor: "pointer",
                      borderRadius: 2,
                      padding: 0.5,
                      border: isSelected ? "1px solid #38bdf8" : "1px solid transparent",
                      background: isSelected ? "rgba(56, 189, 248, 0.08)" : "transparent",
                    }}
                  >
                    <Box sx={{ position: "relative", width: "100%", maxWidth: 72, minWidth: 44, height: 220 }}>
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 0,
                          width: "100%",
                          height: `${availableHeight}px`,
                          background: "#e2e8f0",
                          borderRadius: 1,
                        }}
                      />
                      {availableHeight >= labelMinHeight ? (
                        <Typography
                          variant="caption"
                          sx={{
                            position: "absolute",
                            bottom: Math.max(2, availableHeight - 14),
                            left: 0,
                            right: 0,
                            textAlign: "center",
                            fontSize: 10,
                            color: "#0f172a",
                          }}
                        >
                          {formatMinutesAsHours(availableMinutes)}h
                        </Typography>
                      ) : null}
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 0,
                          width: "100%",
                          height: `${plannedHeight}px`,
                          background: "#38bdf8",
                          borderRadius: 1,
                          opacity: 0.9,
                        }}
                      />
                      {plannedHeight >= labelMinHeight ? (
                        <Typography
                          variant="caption"
                          sx={{
                            position: "absolute",
                            bottom: Math.max(2, plannedHeight - 14),
                            left: 0,
                            right: 0,
                            textAlign: "center",
                            fontSize: 10,
                            color: "#0b1222",
                          }}
                        >
                          {formatMinutesAsHours(plannedMinutes)}h
                        </Typography>
                      ) : null}
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 0,
                          width: "100%",
                          height: `${actualHeight}px`,
                          background: "#0f172a",
                          borderRadius: 1,
                          opacity: 0.85,
                        }}
                      />
                      {actualHeight >= labelMinHeight ? (
                        <Typography
                          variant="caption"
                          sx={{
                            position: "absolute",
                            bottom: Math.max(2, actualHeight - 14),
                            left: 0,
                            right: 0,
                            textAlign: "center",
                            fontSize: 10,
                            color: "#f8fafc",
                          }}
                        >
                          {formatMinutesAsHours(actualMinutes)}h
                        </Typography>
                      ) : null}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? "#0f172a" : "text.secondary",
                      }}
                    >
                      {format(day, "MM/dd")}
                    </Typography>
                  </Stack>
                );
              })}
              </Box>
            </Stack>
            <Divider />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                gap: { xs: 0.5, sm: 1 },
                alignItems: "start",
              }}
            >
              {weekDays.map((day) => {
                const iso = toIsoDate(day);
                const dayEvents = eventsByDate[iso] ?? [];
                const extraCount = dayEvents.length - 2;
                return (
                  <Stack key={iso} spacing={0.5}>
                    {dayEvents.slice(0, 2).map((event) => (
                      <Chip
                        key={event.id}
                        size="small"
                        variant="outlined"
                        label={event.title}
                        sx={{ opacity: 0.7, borderColor: "#cbd5f5" }}
                      />
                    ))}
                    {extraCount > 0 ? (
                      <Chip size="small" label={`+${extraCount}`} sx={{ opacity: 0.6 }} />
                    ) : null}
                  </Stack>
                );
              })}
            </Box>
          </Stack>
        </Paper>
        <Paper
          elevation={0}
          sx={{
            p: 1.25,
            borderRadius: 2,
            border: "1px solid #d5deea",
            background: "#f8fafc",
            height: "100%",
          }}
        >
          <Stack spacing={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              日付: {format(selectedDate, "MM/dd (EEE)", { locale: ja })}
            </Typography>
            <Divider />
            <Stack spacing={0.5}>
              <Typography variant="caption">可能: {formatMinutesAsHours(availability)} h</Typography>
              <Typography variant="caption">計画: {formatMinutesAsHours(plannedByDate[selectedIso] ?? 0)} h</Typography>
              <Typography variant="caption">実績: {formatMinutesAsHours(actualByDate[selectedIso] ?? 0)} h</Typography>
              <Typography variant="caption">
                差分: {formatMinutesAsHours(dailyGap)} h {dailyOver ? "(超過)" : ""}
              </Typography>
              <Box sx={{ height: 6, background: "#e2e8f0", borderRadius: 999 }}>
                <Box
                  sx={{
                    height: "100%",
                    width: `${Math.min(
                      100,
                      ((plannedByDate[selectedIso] ?? 0) / Math.max(availability, 1)) * 100,
                    )}%`,
                    background: dailyOver ? "#ef4444" : "#38bdf8",
                    borderRadius: 999,
                  }}
                />
              </Box>
            </Stack>
            <Divider />
            <Typography variant="subtitle2">予定（参照）</Typography>
            <Stack spacing={0.5}>
              {(eventsByDate[selectedIso] ?? []).length ? (
                (eventsByDate[selectedIso] ?? []).map((event) => (
                  <Typography key={event.id} variant="caption">
                    {event.start.slice(11, 16)} {event.title}
                  </Typography>
                ))
              ) : (
                <Typography variant="caption">予定はありません</Typography>
              )}
            </Stack>
            <Divider />
            <Stack direction="row" spacing={1}>
              <TextField
                label="予定タイトル"
                size="small"
                value={eventTitle}
                onChange={(event) => setEventTitle(event.target.value)}
                sx={{ flex: 1, background: "#ffffff" }}
              />
              <Button variant="contained" size="small" onClick={handleAddEvent}>
                追加
              </Button>
            </Stack>
            {calendarError ? (
              <Typography color="error" variant="caption">
                {calendarError}
              </Typography>
            ) : null}
          </Stack>
        </Paper>
      </Box>
      <Dialog open={calendarOpen} onClose={() => setCalendarOpen(false)}>
        <DialogTitle>週を選択</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
            <DateCalendar
              value={selectedDate}
              onChange={(value) => {
                if (!value) return;
                setSelectedDate(value);
              }}
              showDaysOutsideCurrentMonth
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCalendarOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
