# Project Structure

## Organization Philosophy
- スプリント運用と学習負荷の可視化を中心とした機能分割（カンバン、TCard/TDialog、カレンダー、同期/通知）
- 仕様駆動（`.kiro/specs/learning-plan-kanban/`）を前提にフェーズを進める

## Directory Patterns
### Specs
**Location**: `.kiro/specs/learning-plan-kanban/`  
**Purpose**: 要件・設計・タスクを段階管理（EARS形式でACを保持）  
**Example**: `requirements.md` に領域別のRequirementとAC、`spec.json`にフェーズ/言語/承認状態

### Steering
**Location**: `.kiro/steering/`  
**Purpose**: プロジェクト方針（プロダクト価値、技術構成、構造パターン）の記憶領域  
**Example**: `product.md` で価値とユースケース、`tech.md` でサーバレス＋Google API方針、`structure.md` で組織・命名の原則

### Dev Environment
**Location**: `.devcontainer/`
**Purpose**: VS Code Dev Container の設定ファイル群。ホストPCの環境に依存しない、再現性の高い開発環境を定義する。
**Example**: `devcontainer.json` にて、ベースイメージや導入するVS Code拡張機能、ポートフォワーディングなどを指定。

## Naming Conventions
- ステータス: Backlog / Today / InPro / OnHold / Done / WontFix（固定集合、表示文字列のみ設定可）
- UI要素: TCard（横長、InProのみ正方形）、TDialog（タスク全属性を編集）
- 時間表示: 予定/残り時間ゲージを全TCard共通で持つ

## Import / Module Organization (Guidance)
- カンバン表示・時間計測・カレンダー連携を分離可能なモジュールとして扱う
- 外部API連携（Drive/Calendar）はインフラ層にまとめ、UI層から薄いインターフェース越しに利用

## Code Organization Principles
- オフラインファースト: キャッシュ→再同期のリトライ手段を提供
- データ整合: Today/InPro/OnHoldの残り時間合計で負荷を評価
- 表示責務: Dashboardはバージョン表示・週次集計、カレンダーは予定/負荷/追加タスクの一覧にフォーカス

## Commit Conventions
- 形式: Conventional Commits（例: `feat: ...`, `docs(specs): ...`, `chore: ...`）。言語は日本語で要約し、必要に応じて本文に詳細を記載。
- 内容: 変更の目的と範囲を明示し、異なる変更を1コミットに混在させない。
- 履歴操作: 履歴書き換え時はバックアップブランチを作成し、プッシュは `--force-with-lease` を使用する。

updated_at: 2025-12-09T23:55:00+09:00
