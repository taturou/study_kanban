import { AppBar, Toolbar, Typography, Box, Button, Avatar, Chip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useKanbanStore } from "../store/kanbanStore";
import { KanbanHeader } from "./KanbanHeader";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { t } = useTranslation("common");
  const sprintLabel = useKanbanStore((state) => state.sprintLabel);

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
          </Box>
          <Box sx={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 1 }}>
            <Button color="inherit" size="small">
              Kanban
            </Button>
            <Button color="inherit" size="small">
              Dashboard
            </Button>
            <Chip label="Sync" size="small" />
            <Avatar sx={{ width: 28, height: 28 }}>LP</Avatar>
          </Box>
        </Toolbar>
      </AppBar>
      <KanbanHeader />
      {children}
    </div>
  );
}
