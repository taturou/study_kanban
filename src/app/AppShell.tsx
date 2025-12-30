import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Avatar,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import { DateCalendar, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ja } from "date-fns/locale";
import { startOfWeek } from "date-fns";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useKanbanStore } from "../store/kanbanStore";
import { KanbanHeader } from "./KanbanHeader";
import { SettingsPanel } from "./SettingsPanel";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { t } = useTranslation("common");
  const sprintLabel = useKanbanStore((state) => state.sprintLabel);
  const currentSprintDate = useKanbanStore((state) => state.currentSprintDate);
  const setCurrentSprintDate = useKanbanStore((state) => state.setCurrentSprintDate);
  const navigate = useNavigate();
  const currentPath = useRouterState({ select: (state) => state.location.pathname });
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const syncLabel = useMemo(() => (isOnline ? "Sync Online" : "Sync Offline"), [isOnline]);
  const syncIcon = isOnline ? <CloudDoneIcon /> : <CloudOffIcon />;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [accountAnchor, setAccountAnchor] = useState<null | HTMLElement>(null);
  const [sprintPickerOpen, setSprintPickerOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date | null>(currentSprintDate ?? new Date());

  const isKanban = currentPath === "/";
  const isPlan = currentPath === "/plan";
  const isDashboard = currentPath === "/dashboard";

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!currentSprintDate) return;
    setPickerDate(currentSprintDate);
  }, [currentSprintDate]);

  const sprintDisplayLabel = formatSprintLabel(sprintLabel);

  return (
    <div className="app-shell">
      <AppBar position="sticky" sx={{ background: "#0b1222" }}>
        <Toolbar sx={{ gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
            <Button variant="outlined" color="inherit" size="small" onClick={() => setSettingsOpen(true)}>
              Menu
            </Button>
            <Typography variant="h6">{t("appTitle")}</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, justifyContent: "center" }}>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={() => adjustSprintByWeeks(-1, currentSprintDate, setCurrentSprintDate)}
            >
              ◀
            </Button>
            <Button
              size="small"
              variant="text"
              color="inherit"
              aria-label="スプリント選択"
              onClick={() => setSprintPickerOpen(true)}
            >
              {sprintDisplayLabel}
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={() => adjustSprintByWeeks(1, currentSprintDate, setCurrentSprintDate)}
            >
              ▶
            </Button>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, justifyContent: "flex-end" }}>
            <Button
              color="inherit"
              size="small"
              variant={isPlan ? "outlined" : "text"}
              onClick={() => navigate({ to: "/plan", search: (prev) => prev })}
            >
              プラン
            </Button>
            <Button
              color="inherit"
              size="small"
              variant={isKanban ? "outlined" : "text"}
              onClick={() => navigate({ to: "/", search: (prev) => prev })}
            >
              カンバン
            </Button>
            <Button
              color="inherit"
              size="small"
              variant={isDashboard ? "outlined" : "text"}
              onClick={() => navigate({ to: "/dashboard", search: (prev) => prev })}
            >
              ダッシュボード
            </Button>
            <Chip icon={syncIcon} label={syncLabel} size="small" onClick={() => setSyncOpen(true)} />
            <IconButton
              color="inherit"
              size="small"
              aria-label="アカウント"
              onClick={(event) => setAccountAnchor(event.currentTarget)}
            >
              <Avatar sx={{ width: 28, height: 28 }}>LP</Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      {isKanban ? <KanbanHeader /> : null}
      <div className="app-shell__content" data-view={isKanban ? "kanban" : "standard"}>
        {children}
      </div>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Dialog open={syncOpen} onClose={() => setSyncOpen(false)}>
        <DialogTitle>同期状態</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {isOnline ? "オンラインのため同期を試行できます。" : "オフラインのため同期できません。"}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyncOpen(false)}>閉じる</Button>
          <Button
            onClick={() => setSyncOpen(false)}
            variant="contained"
            disabled={!isOnline}
          >
            今すぐ同期
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={sprintPickerOpen} onClose={() => setSprintPickerOpen(false)}>
        <DialogTitle>週を選択</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
            <DateCalendar
              value={pickerDate}
              onChange={(value) => {
                if (!value) return;
                setPickerDate(value);
                applySprintDate(value, setCurrentSprintDate);
                setSprintPickerOpen(false);
              }}
              showDaysOutsideCurrentMonth
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSprintPickerOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
      <Menu
        anchorEl={accountAnchor}
        open={Boolean(accountAnchor)}
        onClose={() => setAccountAnchor(null)}
      >
        <MenuItem onClick={() => setAccountAnchor(null)}>サインイン</MenuItem>
        <MenuItem onClick={() => setAccountAnchor(null)}>サインアウト</MenuItem>
        <MenuItem onClick={() => setAccountAnchor(null)}>閲覧専用リンク</MenuItem>
      </Menu>
    </div>
  );
}

function formatSprintLabel(label: string) {
  const [startRaw, endRaw] = label.split("〜").map((part) => part.trim());
  if (!startRaw || !endRaw) return label;
  const start = startRaw.replace(/-/g, "/");
  const end = endRaw.replace(/-/g, "/");
  return `${start} - ${end.slice(5)}`;
}

const SPRINT_STORAGE_KEY = "lpk.currentSprintId";
const JST_OFFSET_MINUTES = 9 * 60;

function toIsoDate(value: Date, offsetMinutes = JST_OFFSET_MINUTES) {
  const shifted = new Date(value.getTime() + offsetMinutes * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

function applySprintDate(date: Date, setCurrentSprintDate: (date: Date) => void) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const sprintKey = toIsoDate(weekStart);
  window.localStorage.setItem(SPRINT_STORAGE_KEY, sprintKey);
  setCurrentSprintDate(new Date(`${sprintKey}T00:00:00.000Z`));
}

function adjustSprintByWeeks(
  diff: number,
  currentSprintDate: Date | null,
  setCurrentSprintDate: (date: Date) => void,
) {
  const base = currentSprintDate ?? new Date();
  const next = new Date(base.getTime() + diff * 7 * 24 * 60 * 60 * 1000);
  applySprintDate(next, setCurrentSprintDate);
}
