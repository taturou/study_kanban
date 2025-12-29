import { Box, Stack, Typography, Divider, Paper } from "@mui/material";
import { useMemo } from "react";
import type { Task } from "../domain/types";
import { computeSprintRange } from "../sprint/range";
import { useKanbanStore } from "../store/kanbanStore";
import { buildDashboardSummary } from "../dashboard/summary";

type DashboardViewProps = {
  tasks?: Task[];
  subjects?: string[];
  sprintRange?: { start: Date; end: Date };
};

export function DashboardView({ tasks, subjects, sprintRange }: DashboardViewProps) {
  const storeTasks = useKanbanStore((state) => state.sprintTasks);
  const storeSubjects = useKanbanStore((state) => state.subjects);
  const storeSprintRange = useKanbanStore((state) => state.sprintRange);
  const range = sprintRange ?? storeSprintRange ?? computeSprintRange(new Date());
  const summary = useMemo(
    () =>
      buildDashboardSummary({
        tasks: tasks ?? storeTasks,
        subjects: subjects ?? storeSubjects,
        sprintRange: range,
      }),
    [tasks, storeTasks, subjects, storeSubjects, range],
  );

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
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        週次ダッシュボード
      </Typography>
      <Box
        sx={{
          display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr 1fr" },
          gap: 1.5,
          minHeight: 0,
        }}
      >
        <Paper elevation={0} sx={{ p: 1.25, borderRadius: 2, border: "1px solid #d5deea" }}>
          <Stack spacing={0.5}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              教科別ステータス集計
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 0.75,
              }}
            >
              {Object.entries(summary.statusCounts).map(([subject, counts]) => (
                <Stack key={subject} direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ minWidth: 72, fontWeight: 600 }} variant="body2">
                    {subject}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Backlog {counts.Backlog} / Today {counts.Today} / InPro {counts.InPro} / OnHold {counts.OnHold} / Done{" "}
                    {counts.Done} / WontFix {counts.WontFix}
                  </Typography>
                </Stack>
              ))}
            </Box>
          </Stack>
        </Paper>
        <Paper elevation={0} sx={{ p: 1.25, borderRadius: 2, border: "1px solid #d5deea" }}>
          <Stack spacing={0.5}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              週次サマリ
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 0.5,
              }}
            >
              {Object.keys(summary.doneBySubject).map((subject) => (
                <Typography key={subject} variant="caption" sx={{ color: "text.secondary" }}>
                  {subject}: 完了 {summary.doneBySubject[subject]} 件 / 実績 {summary.minutesBySubject[subject]} 分
                </Typography>
              ))}
            </Box>
          </Stack>
        </Paper>
        <Paper elevation={0} sx={{ p: 1.25, borderRadius: 2, border: "1px solid #d5deea" }}>
          <Stack spacing={0.5}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              バーンダウン
            </Typography>
            <Divider />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 0.5,
              }}
            >
              {summary.burndown.map((item) => (
                <Typography key={item.date} variant="caption" sx={{ color: "text.secondary" }}>
                  {item.date}: 残 {item.remainingCount} 件 / {item.remainingMinutes} 分
                </Typography>
              ))}
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
