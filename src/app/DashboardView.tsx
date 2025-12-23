import { Box, Stack, Typography, Divider } from "@mui/material";
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
  const storeTasks = useKanbanStore((state) => state.tasks);
  const storeSubjects = useKanbanStore((state) => state.subjects);
  const range = sprintRange ?? computeSprintRange(new Date());
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
    <Box sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h5">週次ダッシュボード</Typography>
        <Divider />
        <Stack spacing={1}>
          <Typography variant="h6">教科別ステータス集計</Typography>
          {Object.entries(summary.statusCounts).map(([subject, counts]) => (
            <Stack key={subject} direction="row" spacing={2}>
              <Typography sx={{ minWidth: 80 }}>{subject}</Typography>
              <Typography variant="body2">
                Backlog {counts.Backlog} / Today {counts.Today} / InPro {counts.InPro} / OnHold {counts.OnHold} / Done{" "}
                {counts.Done} / WontFix {counts.WontFix}
              </Typography>
            </Stack>
          ))}
        </Stack>
        <Stack spacing={1}>
          <Typography variant="h6">週次サマリ</Typography>
          {Object.keys(summary.doneBySubject).map((subject) => (
            <Typography key={subject} variant="body2">
              {subject}: 完了 {summary.doneBySubject[subject]} 件 / 実績 {summary.minutesBySubject[subject]} 分
            </Typography>
          ))}
        </Stack>
        <Stack spacing={1}>
          <Typography variant="h6">バーンダウン</Typography>
          <Stack spacing={0.5}>
            {summary.burndown.map((item) => (
              <Typography key={item.date} variant="body2">
                {item.date}: 残 {item.remainingCount} 件 / {item.remainingMinutes} 分
              </Typography>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
