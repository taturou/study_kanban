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

  useEffect(() => {
    if (!dialogState) return;
    setForm({
      title: dialogState.task?.title ?? "",
      detail: dialogState.task?.detail ?? "",
      dueAt: toDateInput(dialogState.task?.dueAt),
      estimateMinutes: dialogState.task?.estimateMinutes ?? 0,
      actuals: dialogState.task?.actuals ?? [],
    });
    requestAnimationFrame(() => {
      titleRef.current?.focus();
      titleRef.current?.select();
    });
  }, [dialogState]);

  if (!dialogState) return null;

  const handleSave = () => {
    saveDialog({
      title: form.title,
      detail: form.detail,
      dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
      estimateMinutes: Number(form.estimateMinutes),
      actuals: form.actuals,
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
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
            value={form.estimateMinutes}
            onChange={(event) => setForm((prev) => ({ ...prev, estimateMinutes: Number(event.target.value) }))}
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
    </Dialog>
  );
}

function ActualsEditor({ value, onChange }: { value: TaskActual[]; onChange: (next: TaskActual[]) => void }) {
  const [date, setDate] = useState("");
  const [minutes, setMinutes] = useState(0);

  const total = value.reduce((sum, item) => sum + item.minutes, 0);

  const addActual = () => {
    if (!date || minutes <= 0) return;
    const next = [
      ...value,
      {
        id: Math.random().toString(36).slice(2, 10),
        at: date,
        minutes,
      },
    ];
    onChange(next);
    setDate("");
    setMinutes(0);
  };

  const deleteActual = (id: string) => {
    onChange(value.filter((item) => item.id !== id));
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">実績時間 (合計 {total} 分)</Typography>
      <Stack direction="row" spacing={1}>
        <TextField type="date" value={date} onChange={(event) => setDate(event.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField type="number" label="分" value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} />
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
