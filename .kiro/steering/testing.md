# Testing Standards

## 方針
- 振る舞い中心で検証し、実装詳細への依存を最小化する。
- 速さと信頼性を優先し、モックは外部依存（Google API など）に限定する。
- クリティカルなユーザージャーニー（カンバン操作、PWA 同期、閲覧専用モード）は深く、その他は幅を確保する。

## ツール選定
- **Unit/Component**: Vitest + React Testing Library + @testing-library/user-event（Vite 統合で高速、JSX/TSX 設定レス）
- **Mock/Integration**: MSW で Google Drive/Calendar などの外部呼び出しをブラウザ・Node 両方で再現
- **E2E**: Playwright（Chromium/Firefox/WebKit）。PWA/Service Worker/offline 動作と通知 UI の実機に近い検証に利用
- **Lint/Static**: TypeScript + ESLint（react/jsx-a11y/import）+ Prettier。ARIA/WCAG 2.1 AA の lint 補助を前提とする

## 配置・命名
- デフォルトは実装横に `*.test.tsx/ts` を配置（カンバン UI などの文脈を共有しやすくする）。E2E は `e2e/` 直下に `*.spec.ts` でまとめる。
- テスト名は「対象の振る舞い + 条件/結果」で記述し、AAA（Arrange-Act-Assert）を基本にする。

## カバレッジと優先度
- 優先対象: ステータス遷移ルール（Today/InPro/OnHold/Done）、時間ゲージの計算、PWA オフライン→再同期、Google Calendar/Drive の双方向同期、閲覧専用モードの更新。
- 目標カバレッジはクリティカル領域で高めに設定し（CI で閾値管理）、例外は理由を明示する。

## アクセシビリティ
- キーボードナビゲーションと主要コンポーネントの ARIA 属性をテストで明示的に検証する。WCAG 2.1 AA への適合を lint とテストの両面で支える。

updated_at: 2025-12-10T05:37:10+09:00
