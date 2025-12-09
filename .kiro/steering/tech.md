# Technology Stack

## Architecture
- サーバレスフロントエンド（GitHub Pages配信、専用バックエンドなし）
- データ同期と認証は Google Drive API + Google アカウント連携で実施
- PWA としてオフライン動作＋オンライン時の自動/手動同期
- Google Calendar 連携で予定を取得/反映（双方向）

## Core Technologies
- **Runtime/Hosting**: GitHub Pages
- **Auth/Storage**: Google アカウント + Google Drive API（ディレクトリ配下に複数ファイル保存を許容）
- **Calendar**: Google Calendar API（予定取得・LPK側予定の反映）
- **App Form Factor**: PWA（iPad Safari / Chrome / Edge / スマートフォン主要ブラウザ）

## Development Standards
- 要件・設計は AI-DLC / Spec Driven（EARSでACを記述）
- ステータスは固定集合（Backlog/Today/InPro/OnHold/Done/WontFix）、表示文字列のみ設定可
- バージョン自動検知・強制アップデートを前提にキャッシュ更新を設計

## Key Technical Decisions
- 専用サーバを持たず、ブラウザ＋Google APIで完結する構成
- オフラインキャッシュ→オンライン時同期（随時＋定期＋手動トリガー）を標準とする
- カレンダー/予定と学習可能時間を結合し、Today負荷判定とゲージ表示に利用

updated_at: 2025-12-09T23:55:00+09:00
