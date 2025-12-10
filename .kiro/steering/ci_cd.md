# CI/CD & PR Workflow

## ブランチ / PR 運用
- `main` は保護ブランチ。開発は `feature/<topic>` / `fix/<topic>` で作業し、PR 経由で `main` へマージする。
- PR は Draft で開始し、レビュー可能になったら Ready へ変更。マージ方式は Squash を基本とし、PR タイトルは Conventional Commits 準拠（日本語可）。
- PR 内容は単一目的に限定し、ステアリング/プロダクト要件と整合することを確認する（設計・タスクフェーズが未完なら先に更新）。
- 必須レビュー: 少なくとも 1 名のレビュー + 全必須チェック成功。自分の PR はセルフマージ禁止。

## 必須チェック（GitHub Actions）
- `npm ci`（依存固定）→ `npm run lint` → `npm run test`（Vitest/RTL）→ `npm run build`（Vite）。すべて成功で PR の Required Status とする。
- Playwright などの E2E は重い場合オプションジョブとし、`e2e-required` ラベル時のみ必須にする。
- キャッシュは `actions/setup-node` の npm キャッシュを利用。Node バージョンは `.nvmrc`/`package.json` engines を優先（未定義なら LTS を使用）。

## GitHub Actions 構成（推奨）
- `ci.yml`: `pull_request` (base: main) で lint/test/build を実行。steps: checkout → setup-node → npm ci → lint/test/build → アーティファクト（必要なら）を保存。
- `deploy.yml`: `push` to `main` で `npm ci && npm run build` 実行後、GitHub Pages（`actions/deploy-pages`）へデプロイ。`GITHUB_TOKEN` 権限は `contents: read`, `pages: write`, `id-token: write` の最小限にする。
- 並列性: ci ジョブは PR ごとに独立。deploy は最新 main のみ実行（古いジョブは concurrency でキャンセル）。

## テストと環境
- 開発・テストは Dev Container 内で実施することを前提にし、ローカル差異を避ける。CI も同一 Node バージョンと npm scripts を使用。
- 外部 API（Google Drive/Calendar）は CI で呼ばない。MSW 等のモックで代替する。

## セキュリティと運用
- Secrets は使用せず `GITHUB_TOKEN` のみで完結する構成を推奨（Pages デプロイも同様）。
- 強制アップデートや PWA キャッシュはデプロイ後に自動適用されるため、デプロイ完了時刻をリリースノート/PR コメントで共有する。

updated_at: 2025-12-10T06:37:00+09:00
