import { Box, Stack, Typography, Divider, Paper, Button, Chip } from "@mui/material";
import { useMemo } from "react";
import type { Task } from "../domain/types";
import { computeSprintRange } from "../sprint/range";
import { useKanbanStore } from "../store/kanbanStore";
import { computeRemainingMinutes } from "../time/timeCalc";

type DashboardViewProps = {
  tasks?: Task[];
  subjects?: string[];
  sprintRange?: { start: Date; end: Date };
  now?: Date;
};

const DEFAULT_DAILY_CAPACITY_MINUTES = 120;
const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const formatMinutesAsHours = (minutes: number) => (minutes / 60).toFixed(1);
const pad2 = (value: number) => String(value).padStart(2, "0");
const formatMonthDay = (date: Date) => `${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`;
const formatWeekday = (date: Date) => WEEKDAY_LABELS[date.getDay()];
const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const readTodayFromSearch = (search: string) => {
  const raw = new URLSearchParams(search).get("today");
  if (!raw) return null;
  const normalized = raw.replace(/\//g, "-");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export function DashboardView({ tasks, subjects, sprintRange, now }: DashboardViewProps) {
  const storeTasks = useKanbanStore((state) => state.sprintTasks);
  const storeSubjects = useKanbanStore((state) => state.subjects);
  const storeSprintRange = useKanbanStore((state) => state.sprintRange);
  const storeStatusLabels = useKanbanStore((state) => state.statusLabels);
  const range = sprintRange ?? storeSprintRange ?? computeSprintRange(new Date());
  const urlToday = typeof window !== "undefined" ? readTodayFromSearch(window.location.search) : null;
  const referenceDate = startOfDay(now ?? urlToday ?? new Date());
  const statusLabelMap = useMemo(
    () => ({
      ...storeStatusLabels,
      Backlog: storeStatusLabels.Backlog === "Backlog" ? "明日以降にやる" : storeStatusLabels.Backlog,
      Today: storeStatusLabels.Today === "Today" ? "今日やる" : storeStatusLabels.Today,
      InPro: storeStatusLabels.InPro === "InPro" ? "勉強中" : storeStatusLabels.InPro,
      OnHold: storeStatusLabels.OnHold === "OnHold" ? "一旦休憩" : storeStatusLabels.OnHold,
      Done: storeStatusLabels.Done === "Done" ? "終わった" : storeStatusLabels.Done,
      WontFix: storeStatusLabels.WontFix === "WontFix" ? "やらない" : storeStatusLabels.WontFix,
    }),
    [storeStatusLabels],
  );
  const resourceSummary = useMemo(() => {
    const sourceTasks = tasks ?? storeTasks;
    const activeTasks = sourceTasks.filter((task) => task.status !== "Done" && task.status !== "WontFix");
    const inProMinutes = activeTasks
      .filter((task) => task.status === "InPro")
      .reduce((sum, task) => sum + computeRemainingMinutes(task), 0);
    const remainingMinutes = activeTasks.reduce((sum, task) => sum + computeRemainingMinutes(task), 0);

    const sprintStart = startOfDay(range.start);
    const sprintEnd = startOfDay(range.end);
    const visibleStart = referenceDate > sprintStart ? referenceDate : sprintStart;
    const remainingDays =
      visibleStart > sprintEnd
        ? 0
        : Math.floor((sprintEnd.getTime() - visibleStart.getTime()) / 86400000) + 1;
    const thisWeekCapacityMinutes = remainingDays * DEFAULT_DAILY_CAPACITY_MINUTES;
    const thisWeekBalanceMinutes = thisWeekCapacityMinutes - remainingMinutes;

    const nextWeekStart = addDays(sprintEnd, 1);
    const nextWeekCapacityMinutes = 7 * DEFAULT_DAILY_CAPACITY_MINUTES;
    const confirmedNextWeekMinutes = 0;
    const estimatedNextWeekMinutes = nextWeekCapacityMinutes;
    const nextWeekLoadMinutes = activeTasks.reduce((sum, task) => {
      if (!task.dueAt) return sum;
      const key = task.dueAt.slice(0, 10);
      const dueDate = new Date(`${key}T00:00:00.000Z`);
      return dueDate >= nextWeekStart && dueDate <= addDays(nextWeekStart, 6)
        ? sum + computeRemainingMinutes(task)
        : sum;
    }, 0);
    const nextWeekAvailableMinutes = nextWeekCapacityMinutes - nextWeekLoadMinutes;

    const remainingByDate = activeTasks.reduce<Record<string, number>>((acc, task) => {
      if (!task.dueAt) return acc;
      const key = task.dueAt.slice(0, 10);
      acc[key] = (acc[key] ?? 0) + computeRemainingMinutes(task);
      return acc;
    }, {});

    const currentWeekDays = Array.from({ length: 7 }, (_, index) => addDays(sprintStart, index))
      .filter((day) => day >= visibleStart && day <= sprintEnd)
      .map((day) => {
        const key = toIsoDate(day);
        return {
          date: day,
          key,
          remainingMinutes: remainingByDate[key] ?? 0,
          capacityMinutes: DEFAULT_DAILY_CAPACITY_MINUTES,
          estimated: false,
        };
      });

    const nextWeekDays = Array.from({ length: 4 }, (_, index) => addDays(nextWeekStart, index)).map((day) => {
      const key = toIsoDate(day);
      return {
        date: day,
        key,
        remainingMinutes: remainingByDate[key] ?? 0,
        capacityMinutes: DEFAULT_DAILY_CAPACITY_MINUTES,
        estimated: true,
      };
    });

    const actionCandidates = activeTasks.filter(
      (task) => ["Today", "OnHold"].includes(task.status) && Boolean(task.dueAt),
    );
    const proposalDate = nextWeekStart;
    const proposalLabel = formatMonthDay(proposalDate);

    const actionItems = actionCandidates.map((task) => {
      const remaining = computeRemainingMinutes(task);
      const hasProposal = remaining <= DEFAULT_DAILY_CAPACITY_MINUTES;
      return {
        task,
        remaining,
        proposalLabel,
        hasProposal,
      };
    });

    return {
      remainingMinutes,
      inProMinutes,
      thisWeekCapacityMinutes,
      thisWeekBalanceMinutes,
      nextWeekCapacityMinutes,
      confirmedNextWeekMinutes,
      estimatedNextWeekMinutes,
      nextWeekAvailableMinutes,
      dailyStrip: [...currentWeekDays, ...nextWeekDays],
      actionItems,
    };
  }, [tasks, storeTasks, range, referenceDate]);

  return (
    <Box
      sx={{
        maxWidth: 1120,
        mx: "auto",
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gap: 1.25,
      }}
    >
      <Stack spacing={1.5}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          週次リソース調整
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 1.5,
          }}
        >
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #d5deea" }}>
            <Stack spacing={0.5}>
              <Typography
                variant="subtitle2"
                component="div"
                sx={{ fontWeight: 700 }}
              >
                今週 (残り{Math.max(0, Math.round(resourceSummary.thisWeekCapacityMinutes / DEFAULT_DAILY_CAPACITY_MINUTES))}日)
              </Typography>
              <Typography variant="body2">
                残作業: {formatMinutesAsHours(resourceSummary.remainingMinutes)} h
                {resourceSummary.inProMinutes > 0
                  ? ` (内 ${statusLabelMap.InPro}: ${formatMinutesAsHours(resourceSummary.inProMinutes)}h)`
                  : ""}
              </Typography>
              <Typography variant="body2">可用枠: {formatMinutesAsHours(resourceSummary.thisWeekCapacityMinutes)} h (確定済)</Typography>
              <Divider />
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: resourceSummary.thisWeekBalanceMinutes < 0 ? "#c62828" : "text.primary" }}
              >
                収支: {formatMinutesAsHours(resourceSummary.thisWeekBalanceMinutes)} h
                {resourceSummary.thisWeekBalanceMinutes < 0 ? " (超過)" : ""}
              </Typography>
            </Stack>
          </Paper>
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #d5deea" }}>
            <Stack spacing={0.5}>
              <Typography variant="subtitle2" component="div" sx={{ fontWeight: 700 }}>
                来週 ({formatMonthDay(addDays(range.end, 1))} - {formatMonthDay(addDays(range.end, 7))})
              </Typography>
              <Typography variant="body2">受入可能枠: {formatMinutesAsHours(resourceSummary.nextWeekCapacityMinutes)} h</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" component="div">
                  確定: {formatMinutesAsHours(resourceSummary.confirmedNextWeekMinutes)} h + 推定:{" "}
                  {formatMinutesAsHours(resourceSummary.estimatedNextWeekMinutes)} h
                </Typography>
                <Chip size="small" label="推定" />
              </Box>
              <Divider />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                空き枠: {formatMinutesAsHours(resourceSummary.nextWeekAvailableMinutes)} h (推定含む)
              </Typography>
            </Stack>
          </Paper>
        </Box>
        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #d5deea" }}>
          <Stack spacing={1}>
            <Typography variant="subtitle2" component="div" sx={{ fontWeight: 700 }}>
              日別負荷状況
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)", md: "repeat(8, 1fr)" },
                gap: 1,
              }}
            >
              {resourceSummary.dailyStrip.map((day) => {
                const capacityHours = formatMinutesAsHours(day.capacityMinutes);
                const remainingHours = formatMinutesAsHours(day.remainingMinutes);
                const overload = day.remainingMinutes > day.capacityMinutes;
                return (
                  <Box
                    key={day.key}
                    sx={{
                      border: "1px solid #d5deea",
                      borderRadius: 1.5,
                      p: 1,
                      bgcolor: overload ? "#ffebee" : "#f7f9fc",
                    }}
                  >
                    <Stack spacing={0.4}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {formatMonthDay(day.date)} ({formatWeekday(day.date)})
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        枠: {capacityHours}h
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        残: {remainingHours}h
                      </Typography>
                      {day.estimated ? (
                        <Chip size="small" label="推定" sx={{ alignSelf: "flex-start" }} />
                      ) : null}
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          </Stack>
        </Paper>
        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #d5deea" }}>
          <Stack spacing={1}>
            <Typography variant="subtitle2" component="div" sx={{ fontWeight: 700 }}>
              ▼ 1. 期限切れ・容量超過
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              ※ 進行中 ({statusLabelMap.InPro}) のタスクはここには表示されません。
            </Typography>
            <Box sx={{ display: "grid", gap: 1 }}>
              {resourceSummary.actionItems.map((item) => {
                const hours = formatMinutesAsHours(item.remaining);
                const impactNextWeek = item.hasProposal ? `来週: +${hours}h (推定)` : "来週: 変更なし";
                const impactThisWeek = item.hasProposal ? `今週: -${hours}h(負荷減)` : "今週: 計画除外";
                return (
                  <Box
                    key={item.task.id}
                    sx={{
                      border: "1px solid #d5deea",
                      borderRadius: 1.5,
                      p: 1,
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr 1.1fr 0.9fr" },
                      gap: 1,
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.task.title} ({hours}h)
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        [{statusLabelMap[item.task.status]}] {item.task.dueAt ? item.task.dueAt.slice(0, 10) : "期日なし"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {item.hasProposal ? `推奨: ${item.proposalLabel}` : "提案なし"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {item.hasProposal ? "理由: 空き枠があるため" : "理由: 来週全ての枠に入りません"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: item.hasProposal ? "#2e7d32" : "text.primary" }}>
                        {impactThisWeek}
                      </Typography>
                      <Typography variant="caption" sx={{ color: item.hasProposal ? "#ef6c00" : "text.secondary" }}>
                        {impactNextWeek}
                      </Typography>
                    </Box>
                    <Box>
                      {item.hasProposal ? (
                        <Button size="small" variant="contained">
                          {item.proposalLabel}へ移動
                        </Button>
                      ) : (
                        <Button size="small" variant="outlined">
                          {statusLabelMap.Backlog} へ
                        </Button>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
            <Box sx={{ borderTop: "1px dashed #d5deea", pt: 1 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                推奨日へ一括変更 ({resourceSummary.actionItems.filter((item) => item.hasProposal).length}件)
                (※「提案なし」のタスクは対象外です)
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
