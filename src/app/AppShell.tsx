import {
  AppBar,
  Toolbar,
  Box,
  Button,
  Avatar,
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
import ViewWeekIcon from "@mui/icons-material/ViewWeek";
import GridViewIcon from "@mui/icons-material/GridView";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useKanbanStore } from "../store/kanbanStore";
import { KanbanHeader } from "./KanbanHeader";
import { SettingsPanel } from "./SettingsPanel";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const sprintLabel = useKanbanStore((state) => state.sprintLabel);
  const currentSprintDate = useKanbanStore((state) => state.currentSprintDate);
  const setCurrentSprintDate = useKanbanStore((state) => state.setCurrentSprintDate);
  const navigate = useNavigate();
  const currentPath = useRouterState({ select: (state) => state.location.pathname });
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
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
            <IconButton color="inherit" size="small" aria-label="メニュー" onClick={() => setSettingsOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                px: 1.25,
                py: 0.25,
                borderRadius: 999,
                background: "rgba(148, 163, 184, 0.2)",
              }}
            >
              <IconButton
                size="small"
                color="inherit"
                aria-label="前のスプリント"
                onClick={() => adjustSprintByWeeks(-1, currentSprintDate, setCurrentSprintDate)}
              >
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              <Button
                size="small"
                variant="text"
                color="inherit"
                aria-label="スプリント選択"
                onClick={() => setSprintPickerOpen(true)}
                sx={{ whiteSpace: "nowrap", minWidth: "auto" }}
              >
                {sprintDisplayLabel}
              </Button>
              <IconButton
                size="small"
                color="inherit"
                aria-label="次のスプリント"
                onClick={() => adjustSprintByWeeks(1, currentSprintDate, setCurrentSprintDate)}
              >
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ flex: 2, display: "flex", justifyContent: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                color="inherit"
                size="small"
                aria-label="プラン"
                onClick={() => navigate({ to: "/plan", search: (prev) => prev })}
                sx={{ background: isPlan ? "rgba(148, 163, 184, 0.2)" : "transparent" }}
              >
                <ViewWeekIcon fontSize="small" />
              </IconButton>
              <IconButton
                color="inherit"
                size="small"
                aria-label="カンバン"
                onClick={() => navigate({ to: "/", search: (prev) => prev })}
                sx={{ background: isKanban ? "rgba(148, 163, 184, 0.2)" : "transparent" }}
              >
                <GridViewIcon fontSize="small" />
              </IconButton>
              <IconButton
                color="inherit"
                size="small"
                aria-label="ダッシュボード"
                onClick={() => navigate({ to: "/dashboard", search: (prev) => prev })}
                sx={{ background: isDashboard ? "rgba(148, 163, 184, 0.2)" : "transparent" }}
              >
                <DashboardIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, justifyContent: "flex-end" }}>
            <IconButton
              color="inherit"
              size="small"
              aria-label="同期状態"
              onClick={() => setSyncOpen(true)}
            >
              {syncIcon}
            </IconButton>
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
