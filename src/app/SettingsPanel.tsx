import {
  Drawer,
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { STATUS_ORDER } from "../status/policy";
import { useKanbanStore } from "../store/kanbanStore";

type SettingsPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const statusLabels = useKanbanStore((state) => state.statusLabels);

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 320, p: 2 }}>
        <Typography variant="h6">設定</Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2">ステータス表示名</Typography>
        <List dense>
          {STATUS_ORDER.map((status) => (
            <ListItem key={status}>
              <ListItemText primary={`${statusLabels[status]}`} secondary={status} />
            </ListItem>
          ))}
        </List>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2">バージョン</Typography>
        <Typography variant="body2">--</Typography>
      </Box>
    </Drawer>
  );
}
