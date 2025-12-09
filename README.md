# study_kanban

学習計画をカンバン形式で管理し、1週間スプリントで進捗と負荷を最適化するPWAプロジェクトです。GitHub Pages配信とGoogle Drive APIを組み合わせ、サーバレスでマルチデバイス利用を目指します。

## 目的と特徴
- 教科×ステータスの2次元カンバンで学習タスクを整理し、固定ステータス順で可視化。
- 1週間スプリント運用（週次計画・日次運用・週末レビュー）に沿った計画とバーンダウンの確認。
- タスク作成/編集ダイアログ、ドラッグ&ドロップ移動、優先度順ソート、勉強中の単一性制御、ポモドーロ/実績時間計測。
- カレンダーとダッシュボードで期限迫近/超過、予定・学習可能時間、週次サマリを可視化。
- PWA対応、オフライン操作、非モーダル同期/通知、閲覧専用モードでの保護者共有。

## ディレクトリ
- `.kiro/specs/learning-plan-kanban/` : 現行仕様（`spec.json` と `requirements.md`）。言語は日本語。要件はEARS形式。
- `.kiro/settings/rules/` : EARS書式や設計・タスク生成などの共通ルール。
- `AGENTS.md` : AI-DLC運用とスペック駆動開発のガイド。
- `memo.txt` : 開発メモ（任意）。
- `scripts/update_code_AIs.sh` : codex / gemini / copilot CLI を npm -g で更新し、更新前後のバージョンを表示するユーティリティ。

## 開発フロー（AI-DLC）
1. 要件: `/prompts:kiro-spec-requirements learning-plan-kanban`
2. 設計: `/prompts:kiro-spec-design learning-plan-kanban -y`
3. タスク: `/prompts:kiro-spec-tasks learning-plan-kanban -y`
4. 実装: `/prompts:kiro-spec-impl learning-plan-kanban`
   - 進捗確認: `/prompts:kiro-spec-status learning-plan-kanban`
   - 必要に応じてギャップ/設計/実装バリデーションの各プロンプトを利用

## 現在の状態
- 要件: 生成済み（未承認）。`.kiro/specs/learning-plan-kanban/requirements.md`
- 言語: 日本語（`spec.json` の language: "ja"）
- 次ステップ: 要件レビュー後に設計フェーズへ移行。

## デプロイ想定
- GitHub Pages配信を前提とし、データはGoogle Drive APIに保存（専用サーバなし）。
- PWAとしてiPad Safari / Chrome / Edge / スマートフォン主要ブラウザで利用可能にする。
