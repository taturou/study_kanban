import { Box, Divider, Stack, Typography } from "@mui/material";

export function HelpPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h5">ヘルプ</Typography>
        <Divider />
        <Stack spacing={1}>
          <Typography variant="h6">タスク作成</Typography>
          <Typography variant="body2">Backlog のプラス操作で TDialog を開き、タイトルと期日を入力します。</Typography>
        </Stack>
        <Stack spacing={1}>
          <Typography variant="h6">ステータス移動</Typography>
          <Typography variant="body2">Today 先頭のみ InPro へ移動でき、Done は InPro/OnHold からのみ可能です。</Typography>
        </Stack>
        <Stack spacing={1}>
          <Typography variant="h6">ダイアログ操作</Typography>
          <Typography variant="body2">Tab で移動し、Ctrl+Enter で保存、Esc でキャンセルします。</Typography>
        </Stack>
        <Stack spacing={1}>
          <Typography variant="h6">カレンダー利用</Typography>
          <Typography variant="body2">日付ビューで期日タスクと当日追加/実施タスクを確認できます。</Typography>
        </Stack>
        <Stack spacing={1}>
          <Typography variant="h6">時間設定</Typography>
          <Typography variant="body2">学習可能時間は日付ごとに上書きでき、ヘッダーのゲージに反映されます。</Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
