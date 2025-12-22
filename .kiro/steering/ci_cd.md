# CI/CD & PR Workflow

## ブランチ運用
- `main` は保護ブランチ。開発は `feature/<topic>` または `fix/<topic>` で行い、PR 経由で `main` に統合する。
- コミットは Conventional Commits（日本語可）で単一目的に絞る。複数トピックを混在させない。
- 長期作業は Draft PR で早期共有し、Ready 後にレビューを受ける。マージ方式は Squash を基本とする。

## PR 方針
- 必須: 最低 1 名のレビュー + 全ての必須 CI チェック成功。セルフマージ禁止。
- PR タイトルは Conventional Commits 形式（例: `feat: ...`）。本文に目的・範囲・影響範囲・テスト結果を簡潔に記載。
- 大きな変更は分割し、UI/仕様変更はスクリーンショットや要件との対応を記載する。
- マージ方式: デフォルトは Squash。履歴を残したい場合のみ `merge-commit` ラベルを付与して通常マージを許可。Rebase マージは使用しない。

## GitHub Actions（推奨構成）
- `ci.yml`（pull_request/target: main）  
  - steps: checkout → setup-node (LTS or .nvmrc) → `npm ci` → `npm run lint` → `npm run test`（Vitest/RTL）→ `npm run build`（Vite）。  
  - status を Required に設定。
- `deploy.yml`（push/main）  
  - `npm ci && npm run build` → `actions/deploy-pages` で GitHub Pages へデプロイ。  
  - `GITHUB_TOKEN` 権限は `contents: read`, `pages: write`, `id-token: write` の最小限。
- E2E（Playwright）は重い場合オプションジョブとし、`merge-commit` で通常マージするような大きな変更や `e2e-required` ラベル時のみ必須にする。
- キャッシュ: `actions/setup-node` の npm キャッシュを利用。依存は `npm ci` で固定。

## 開発環境とテスト
- CI と同一の Node バージョンと npm scripts を利用し、ローカル差異を排除する。
- 外部 API（Google Drive/Calendar）は CI ではモック（MSW 等）で置き換え、実 API 呼び出しを避ける。

## セキュリティと運用
- Secrets を使わず `GITHUB_TOKEN` で完結する構成を推奨。必要な場合は環境ごとに分離し、最小権限を付与する。
- Pages デプロイは最新 main のみ実行し、古いデプロイジョブは concurrency でキャンセルする。
- PWA 強制アップデートが走るため、デプロイ後にバージョン切替をリリースノートや PR コメントで共有する。

## リポジトリ設定（UI で実施すると簡単なもの）
- GitHub Pages の初回有効化（Settings → Pages → Source: GitHub Actions）。
- プロジェクトのデフォルトマージ方式設定（Squash 有効、Merge Commit 有効、Rebase 無効、Merge 後にブランチ自動削除）。

## リポジトリ設定（gh コマンドでも実施可能なもの）
- ブランチ保護（main）: 必須ステータスチェック、レビュー必須、セルフマージ禁止。
  ```bash
  gh api -X PUT repos/:owner/:repo/branches/main/protection \
    -f required_status_checks.strict=true \
    -f required_status_checks.contexts[]='ci (lint/test/build)' \
    -f enforce_admins=true \
    -f required_pull_request_reviews.dismiss_stale_reviews=true \
    -f required_pull_request_reviews.required_approving_review_count=1 \
    -f restrictions=null
  ```
- マージ方式（Squash/通常マージを許可、Rebase 無効、ブランチ自動削除）:
  ```bash
  gh api -X PATCH repos/:owner/:repo \
    -f allow_squash_merge=true \
    -f allow_merge_commit=true \
    -f allow_rebase_merge=false \
    -f delete_branch_on_merge=true
  ```
- ラベル連動チェックを厳格にしたい場合: `merge-commit` ラベルが無いと失敗するワークフローを追加し、そのステータスを上記 required_status_checks に追加する。

updated_at: 2025-12-10T10:42:00+09:00
