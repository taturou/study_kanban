#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI が見つかりません。https://cli.github.com/ からインストールしてください。" >&2
  exit 1
fi

if [[ $# -lt 1 ]]; then
  echo "使い方: scripts/gh-setup.sh owner/repo" >&2
  exit 1
fi

REPO="$1"
if [[ "${REPO}" != *"/"* ]]; then
  echo "owner/repo 形式で指定してください (例: org/study_kanban)." >&2
  exit 1
fi

echo "ターゲット: ${REPO}"
echo "main ブランチの保護ルールを設定します..."
gh api --method PUT "repos/${REPO}/branches/main/protection" \
  -H "Accept: application/vnd.github+json" \
  -H "Content-Type: application/json" \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["CI/CD", "ci", "deploy"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "required_approving_review_count": 1
  },
  "restrictions": null
}
EOF

echo "マージ方式と Pages 設定を適用します..."
gh api --method PATCH "repos/${REPO}" \
  -H "Accept: application/vnd.github+json" \
  -F allow_squash_merge=true \
  -F allow_merge_commit=true \
  -F allow_rebase_merge=false \
  -F delete_branch_on_merge=true

echo "Pages を GitHub Actions 配信で有効化します (存在しない場合は新規作成)..."
# まず新規作成（既に存在する場合は 409 になるので無視）
gh api --method POST "repos/${REPO}/pages" \
  -H "Accept: application/vnd.github+json" \
  -F build_type=workflow \
  -F https_enforced=true >/dev/null 2>&1 || true

# 既存設定の更新（HTTPS 強制を再度適用）
gh api --method PUT "repos/${REPO}/pages" \
  -H "Accept: application/vnd.github+json" \
  -F build_type=workflow \
  -F https_enforced=true

echo "設定が完了しました。GitHub Pages のデプロイは Actions ワークフロー (CI/CD) から実行されます。"
