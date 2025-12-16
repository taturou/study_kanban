# GitHub Pages と CI/CD の設定手順

GitHub Actions で `main` ブランチへの push / PR をトリガーに `lint` → `test` → `build` を実行し、成功時に GitHub Pages へデプロイします。デプロイは `actions/deploy-pages` で自動実行され、成果物は `dist` ディレクトリからアップロードされます。

## gh スクリプトで一括設定する
1. 前提: `gh auth login` 済みで、対象リポジトリに管理者権限を持つこと。
2. 実行:  
   ```bash
   ./scripts/gh-setup.sh owner/repo
   ```  
   例: リポジトリが `https://github.com/taturou/study_kanban` の場合は  
   ```bash
   ./scripts/gh-setup.sh taturou/study_kanban
   ```  
   - main ブランチ保護（必須ステータスチェック: `ci`, `deploy` のみ、レビュー不要で自己承認なし）  
   - マージ方式（Squash/通常マージのみ許可、Rebase 無効、マージ後のブランチ自動削除、Auto-merge 許可）  
   - Pages を GitHub Actions (workflow) 配信に設定（未作成なら自動作成）。証明書発行が終わる前は 404 になる場合があるので、その場合は数分待って再実行してください。
3. 初回デプロイ: `main` に push するか、Actions から `CI/CD` を手動実行すると Pages が公開されます。

## 手動で設定する場合
1. Settings → Pages  
   - Build and deployment: **GitHub Actions** を選択  
   - HTTPS Enforcement: 有効にする
2. Settings → Branches → Add branch protection rule  
   - Branch name pattern: `main`  
   - Require status checks: `ci`, `deploy` を選択し strict モード  
   - Require pull request reviews: 無効（自動マージを許可するため）  
   - Include administrators: 任意
3. Settings → General → Pull Requests  
   - Allow squash merge: 有効  
   - Allow merge commit: 有効  
   - Allow rebase merge: 無効  
   - Automatically delete head branches: 有効  
   - Enable auto-merge: 有効  

## ワークフローの確認
- ワークフロー定義: `.github/workflows/ci.yml`
- テストコマンド: `npm test`（Node.js 標準の `node --test` で実行）
- デプロイ成果物: `npm run build` で生成する `dist/`
- ローカル確認: `npm run build` 後に `dist/index.html` をブラウザで開く
