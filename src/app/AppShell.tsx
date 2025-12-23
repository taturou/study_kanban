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
  const navigate = useNavigate();
  const currentPath = useRouterState({ select: (state) => state.location.pathname });
  const [nowText, setNowText] = useState(() => formatDateTime(new Date()));
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const syncLabel = useMemo(() => (isOnline ? "Sync Online" : "Sync Offline"), [isOnline]);
  const syncIcon = isOnline ? <CloudDoneIcon /> : <CloudOffIcon />;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [accountAnchor, setAccountAnchor] = useState<null | HTMLElement>(null);

  const isKanban = currentPath === "/";
  const isDashboard = currentPath === "/dashboard";

  useEffect(() => {
    const tick = () => setNowText(formatDateTime(new Date()));
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

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

  return (
    <div className="app-shell">
      <AppBar position="sticky" sx={{ background: "#0b1222" }}>
        <Toolbar sx={{ gap: 2 }}>
          <Button variant="outlined" color="inherit" size="small" onClick={() => setSettingsOpen(true)}>
            Menu
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6">{t("appTitle")}</Typography>
            <Chip label={sprintLabel} size="small" />
            <Button
              variant="text"
              color="inherit"
              size="small"
              aria-label="日付ビューへ"
              sx={{ minWidth: "auto", padding: 0.5, opacity: 0.8 }}
              onClick={() => navigate({ to: "/calendar" })}
            >
              {nowText}
            </Button>
          </Box>
          <Box sx={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              color="inherit"
              size="small"
              variant={isKanban ? "outlined" : "text"}
              onClick={() => navigate({ to: "/" })}
            >
              Kanban
            </Button>
            <Button
              color="inherit"
              size="small"
              variant={isDashboard ? "outlined" : "text"}
              onClick={() => navigate({ to: "/dashboard" })}
            >
              Dashboard
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
      {children}
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

function formatDateTime(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}
