# Technology Stack

## Architecture
- サーバレスフロントエンド（GitHub Pages配信、専用バックエンドなし）
- データ同期と認証は Google Drive API + Google アカウント連携で実施
- PWA としてオフライン動作＋オンライン時の自動/手動同期
- Google Calendar 連携で予定を取得/反映（双方向）

## Core Technologies
- **Language**: TypeScript (v5.3)
- **UI Framework**: React.js (v18)
- **Runtime/Hosting**: GitHub Pages
- **Build Tool**: Vite - ESM dev server（esbuild 事前バンドル）＋Rollup ビルドで軽量・静的配信に最適化
- **Auth/Storage**: Google アカウント + Google Drive API
- **Calendar**: Google Calendar API
- **App Form Factor**: PWA

## Libraries & Frameworks
- **UI Components**: Material-UI (MUI) - モダンでレスポンシブなUIを構築
- **Icons**: @mui/icons-material - Material Designに準拠したアイコンセット
- **Drag & Drop**: Dnd Kit - モダンで高い柔軟性を持つドラッグ＆ドロップツールキット
- **State Management**: Zustand - 軽量で直感的な状態管理
- **Routing**: TanStack Router - 完全な型安全性を備えた次世代ルーター
- **Date/Time**: Temporal (Polyfill) - 未来のJavaScript標準の日付/時刻API

## Development Standards
- 要件・設計は AI-DLC / Spec Driven（EARSでACを記述）
- ステータスは固定集合（Backlog/Today/InPro/OnHold/Done/WontFix）、表示文字列のみ設定可
- バージョン自動検知・強制アップデートを前提にキャッシュ更新を設計

## Key Technical Decisions
- 専用サーバを持たず、ブラウザ＋Google APIで完結する構成
- オフラインキャッシュ→オンライン時同期（随時＋定期＋手動トリガー）を標準とする
- カレンダー/予定と学習可能時間を結合し、Today負荷判定とゲージ表示に利用
- Material-UI のテーマ機能を利用し、カラーパレットやタイポグラフィを柔軟に変更可能とする
- RSC/SSR を必須としない静的配信＋PWA 構成に合わせ、Vite を標準ビルド基盤として採用（dev: esbuild で高速HMR、build: Rollup/Rolldown 互換で将来性を確保）。RSC 要件が出た場合のみ Next.js/Remix などへ再検討する。

updated_at: 2025-12-10T05:37:10+09:00
