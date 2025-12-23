import { AppBar, Toolbar, Typography, Box, Button, Avatar, Chip } from "@mui/material";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useKanbanStore } from "../store/kanbanStore";
import { KanbanHeader } from "./KanbanHeader";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { t } = useTranslation("common");
  const sprintLabel = useKanbanStore((state) => state.sprintLabel);
  const [nowText, setNowText] = useState(() => formatDateTime(new Date()));
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const syncLabel = useMemo(() => (isOnline ? "Sync Online" : "Sync Offline"), [isOnline]);
  const syncIcon = isOnline ? <CloudDoneIcon /> : <CloudOffIcon />;

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
          <Button variant="outlined" color="inherit" size="small">
            Menu
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6">{t("appTitle")}</Typography>
            <Chip label={sprintLabel} size="small" />
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {nowText}
            </Typography>
          </Box>
          <Box sx={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 1 }}>
            <Button color="inherit" size="small">
              Kanban
            </Button>
            <Button color="inherit" size="small">
              Dashboard
            </Button>
            <Chip icon={syncIcon} label={syncLabel} size="small" />
            <Avatar sx={{ width: 28, height: 28 }}>LP</Avatar>
          </Box>
        </Toolbar>
      </AppBar>
      <KanbanHeader />
      {children}
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
