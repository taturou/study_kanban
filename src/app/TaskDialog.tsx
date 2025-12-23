import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  IconButton,
  Typography,
  DialogContentText,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useRef, useState } from "react";
import { useKanbanStore } from "../store/kanbanStore";
import type { TaskActual } from "../domain/types";

type TaskFormState = {
  title: string;
  detail: string;
  dueAt: string;
  estimateMinutes: number;
  actuals: TaskActual[];
};

function toDateInput(value?: string) {
  if (!value) return "";
  return value.slice(0, 10);
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

export function TaskDialog() {
  const dialogState = useKanbanStore((state) => state.dialogState);
  const closeDialog = useKanbanStore((state) => state.closeDialog);
  const saveDialog = useKanbanStore((state) => state.saveDialog);
  const deleteDialogTask = useKanbanStore((state) => state.deleteDialogTask);
  const titleRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<TaskFormState>(() => ({
    title: dialogState?.task?.title ?? "",
    detail: dialogState?.task?.detail ?? "",
    dueAt: toDateInput(dialogState?.task?.dueAt),
    estimateMinutes: dialogState?.task?.estimateMinutes ?? 0,
    actuals: dialogState?.task?.actuals ?? [],
  }));
  const [estimateInput, setEstimateInput] = useState(
    dialogState?.task?.estimateMinutes != null ? String(dialogState.task.estimateMinutes) : "0",
  );
  const [titleErrorOpen, setTitleErrorOpen] = useState(false);

  useEffect(() => {
    if (!dialogState) return;
    setForm({
      title: dialogState.task?.title ?? "",
      detail: dialogState.task?.detail ?? "",
      dueAt: toDateInput(dialogState.task?.dueAt),
      estimateMinutes: dialogState.task?.estimateMinutes ?? 0,
      actuals: dialogState.task?.actuals ?? [],
    });
    setEstimateInput(dialogState.task?.estimateMinutes != null ? String(dialogState.task.estimateMinutes) : "0");
    setTitleErrorOpen(false);
    requestAnimationFrame(() => {
      titleRef.current?.focus();
      titleRef.current?.select();
    });
  }, [dialogState]);

  if (!dialogState) return null;

  const handleSave = () => {
    const normalizedTitle = form.title.trim();
    if (!normalizedTitle) {
      setTitleErrorOpen(true);
      return;
    }
    const estimateParsed = Number.parseInt(estimateInput, 10);
    const estimateNormalized = Number.isFinite(estimateParsed) ? estimateParsed : 0;
    saveDialog({
      title: normalizedTitle,
      detail: form.detail,
      dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
      estimateMinutes: estimateNormalized,
      actuals: form.actuals,
    });
    setEstimateInput(String(estimateNormalized));
    setForm((prev) => ({ ...prev, estimateMinutes: estimateNormalized }));
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (titleErrorOpen) return;
    if (event.key === "Escape") {
      closeDialog();
    }
    if (event.key === "Enter" && event.ctrlKey) {
      handleSave();
    }
  };

  return (
    <Dialog open onClose={closeDialog} fullWidth maxWidth="sm" onKeyDown={handleKeyDown}>
      <DialogTitle>タスク {dialogState.mode === "new" ? "作成" : "編集"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="タイトル"
            value={form.title}
            autoFocus
            inputRef={titleRef}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          />
          <TextField
            label="詳細"
            multiline
            rows={3}
            value={form.detail}
            onChange={(event) => setForm((prev) => ({ ...prev, detail: event.target.value }))}
          />
          <TextField
            label="期日"
            type="date"
            value={form.dueAt}
            onChange={(event) => setForm((prev) => ({ ...prev, dueAt: event.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="予定時間(分)"
            type="number"
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
            value={estimateInput}
            onChange={(event) => {
              setEstimateInput(event.target.value);
            }}
            onBlur={() => {
              const next = Number.parseInt(estimateInput, 10);
              const normalized = Number.isFinite(next) ? next : 0;
              setEstimateInput(String(normalized));
              setForm((prev) => ({ ...prev, estimateMinutes: normalized }));
            }}
          />
          <ActualsEditor value={form.actuals} onChange={(actuals) => setForm((prev) => ({ ...prev, actuals }))} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog}>キャンセル</Button>
        <Button onClick={handleSave} variant="contained">
          保存
        </Button>
        <IconButton onClick={deleteDialogTask} color="error" aria-label="delete">
          <DeleteIcon />
        </IconButton>
      </DialogActions>
      <Dialog open={titleErrorOpen} onClose={() => setTitleErrorOpen(false)}>
        <DialogTitle>タイトル未入力</DialogTitle>
        <DialogContent>
          <DialogContentText>タイトルを入力してから保存してください。</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTitleErrorOpen(false)} autoFocus>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}

function ActualsEditor({ value, onChange }: { value: TaskActual[]; onChange: (next: TaskActual[]) => void }) {
  const [date, setDate] = useState(todayInput());
  const [minutesInput, setMinutesInput] = useState("0");

  const total = value.reduce((sum, item) => sum + item.minutes, 0);

  const addActual = () => {
    const minutes = Number.parseInt(minutesInput, 10);
    if (!date || !Number.isFinite(minutes) || minutes <= 0) return;
    const next = [
      ...value,
      {
        id: Math.random().toString(36).slice(2, 10),
        at: date,
        minutes,
      },
    ];
    onChange(next);
    setDate(todayInput());
    setMinutesInput("0");
  };

  const deleteActual = (id: string) => {
    onChange(value.filter((item) => item.id !== id));
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">実績時間 (合計 {total} 分)</Typography>
      <Stack direction="row" spacing={1}>
        <TextField
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="number"
          label="分"
          inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
          value={minutesInput}
          onChange={(event) => {
            setMinutesInput(event.target.value);
          }}
          onBlur={() => {
            const next = Number.parseInt(minutesInput, 10);
            const normalized = Number.isFinite(next) ? next : 0;
            setMinutesInput(String(normalized));
          }}
        />
        <Button onClick={addActual} variant="outlined">
          追加
        </Button>
      </Stack>
      {value.map((item) => (
        <Stack key={item.id} direction="row" spacing={1} alignItems="center">
          <Typography>{item.at}</Typography>
          <Typography>{item.minutes} 分</Typography>
          <Button size="small" onClick={() => deleteActual(item.id)}>
            削除
          </Button>
        </Stack>
      ))}
    </Stack>
  );
}
