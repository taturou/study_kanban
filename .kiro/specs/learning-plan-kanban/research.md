# Research & Design Decisions

---
**Purpose**: 発見事項と設計判断の根拠を記録する。
---

## Summary
- **Feature**: learning-plan-kanban
- **Discovery Scope**: New Feature
- **Key Findings**:
  - オフライン前提のため、IndexedDB ベースのローカルストアと Google Drive 同期エンジンを疎結合に分離し、双方向同期はキュー＋世代管理で競合を抑制する。
  - Google Calendar 連携は予定取得と差分反映を別ポーリングに分離し、学習可能時間算出はローカルキャッシュ経由で行うことでオフライン時も動作を継続する。
  - UI/UX 要件（固定ステータス列、唯一の InPro、Today 過負荷警告）を状態マシンとして表現し、DnD とステータス遷移をガードするポリシーレイヤが必要。

## Research Log

### オフライン同期とデータ保持
- **Context**: PWA で Google Drive を主ストレージにしつつオフライン操作を許可する必要がある。
- **Sources Consulted**: 既知の Google Drive API 仕様、Workbox ベストプラクティス。
- **Findings**:
  - Drive API はクライアント側で `files.create/update` を使用し、差分検知は `files.list` + `modifiedTime` / `changes` で可能。
  - ローカルは IndexedDB に Task/Subject/Sprint のスナップショットと変更キューを保持し、オンライン時にキューを flush。世代 ID（lastSyncedAt + revision）で競合を検出。
  - オフライン時の Service Worker は `stale-while-revalidate` より事前キャッシュ＋手動再同期通知のほうが UX 安定。
- **Implications**: 同期エンジンを UI と分離し、状態管理層からは「ローカル一貫性 + 同期イベント」の契約で扱う。

### Google Calendar 連携と学習可能時間
- **Context**: 予定取得と双方向更新が要件。オフライン時もカレンダー情報を表示する必要がある。
- **Sources Consulted**: 既知の Calendar API 仕様（Events リソース）、一般的な ETag/SyncToken 運用。
- **Findings**:
  - 双方向同期には `syncToken` を利用した差分取得が適合。ローカルキャッシュに予定を保存し、日次/週次ビューで利用。
  - 学習可能時間の算出はカレンダー予定と曜日デフォルト、当日上書き値を合成する関数として独立させる。
  - 双方向更新は失敗時リトライ＋衝突時の再取得フローが必要。
- **Implications**: カレンダーは専用アダプタとローカルキャッシュモデルを持ち、同期ジョブはドメインイベント経由でステータスに反映。

### DnD とステータス遷移ポリシー
- **Context**: 固定ステータス列と InPro の唯一性、Today 過負荷警告など、DnD とロジックを分離する必要がある。
- **Sources Consulted**: dnd-kit 既知のパターン、状態マシン設計ナレッジ。
- **Findings**:
  - DnD のドロップ許可判定は UI 層で行わず、ドメインポリシー（Today→InPro 制約、Done 遷移ガード）に委譲する。
  - 優先度順ソートはセル内の comparator として共通化し、InPro は単一カード前提で別描画パスを持つ。
- **Implications**: ステータス遷移ポリシーを独立したサービス/フックで設計し、テスト可能にする。

### アクセシビリティと入力制御
- **Context**: WCAG 2.1 AA とキーボード操作要件。
- **Sources Consulted**: 一般的な ARIA ガイドライン。
- **Findings**:
  - DnD はキーボード操作用のフォーカス移動と Enter/Space での pick/drop を実装する必要がある（マウス/タッチと分離）。
  - モーダル（TDialog）はフォーカストラップ、Esc/Enter ショートカット、Tab オーダーが必須。
- **Implications**: UI コンポーネント契約にキーボード操作と ARIA 属性の要件を明示し、テストで検証する。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Client-side Clean (Ports/Adapters) | UI/State と同期/外部 API をポート経由で分離 | オフライン前提で疎結合、テスト容易 | アダプタ実装コスト、同期キューの複雑さ | 採用 |
| SPA with ad-hoc services | 単一層で直接 API 呼び出し | 実装が速い | 同期/ポリシーが UI に漏れ、テスト困難 | 不採用 |
| SSR/RSC ベース (Next.js) | サーバ協調の UI/データ取得 | 将来の RSC 拡張余地 | GitHub Pages 配信と矛盾、PWA オフライン要件に不適 | 不採用 |

## Design Decisions

### Decision: 同期エンジンをローカルストアと分離したポートにする
- **Context**: オフライン操作と Google Drive 同期を両立する必要がある。
- **Alternatives Considered**:
  1. UI から直接 Drive API を呼ぶ
  2. 同期エンジン（ポート/アダプタ）を挟む
- **Selected Approach**: 2 を採用し、ローカルストア（IndexedDB）と同期キューをドメイン層で管理、Drive/Calendar はアダプタで実装。
- **Rationale**: 競合解決とリトライ、将来のストレージ拡張（他クラウド）に対応しやすい。
- **Trade-offs**: 初期実装コスト増。キュー/世代管理のテストが必要。
- **Follow-up**: キューの永続フォーマットと競合解決ポリシーを実装フェーズで確定。

### Decision: ステータス遷移をポリシーサービス＋状態マシンで制御
- **Context**: 固定ステータス列、唯一の InPro、Today→InPro 制約などのガードが複雑。
- **Alternatives Considered**:
  1. DnD ハンドラに直接条件分岐
  2. 状態マシン/ポリシーサービスで遷移を集中管理
- **Selected Approach**: 2 を採用し、遷移の可否と副作用（自動 OnHold など）を共通化。
- **Rationale**: テスト容易性と要件追従性が高い。
- **Trade-offs**: 遷移モデルの設計コスト。
- **Follow-up**: 状態マシンのイベント定義と戻り値（許可/拒否/副作用リスト）を決める。

### Decision: カレンダー同期は syncToken 方式＋オフラインキャッシュ
- **Context**: 双方向同期とオフライン表示が必須。
- **Alternatives Considered**:
  1. 毎回フルフェッチ
  2. syncToken 差分取得＋ローカルキャッシュ
- **Selected Approach**: 2 を採用し、予定変更はキューに積んでオンライン時に反映。衝突は再取得で解消。
- **Rationale**: 通信量削減とオフライン継続性。
- **Trade-offs**: トークン失効時のフルリロード処理が必要。
- **Follow-up**: トークン失効時のリカバリ手順をテストで確認。

### Decision: PWA 更新は強制アップデートを前提にし、通知を非モーダルで行う
- **Context**: 要件に強制アップデートがある。
- **Alternatives Considered**:
  1. 緩やかな更新（ユーザー承認）
  2. 強制更新＋通知
- **Selected Approach**: 2 を採用し、Service Worker 更新検知で即時クライアント再読み込みを促す。
- **Rationale**: バージョン不整合を防止し、同期ロジックの整合を保つ。
- **Trade-offs**: 作業中のコンテキスト喪失リスク。
- **Follow-up**: 作業中警告と手動再読み込みオプションを検討。

## Risks & Mitigations
- オフライン中の競合増大 — 世代 ID と変更キューを利用し、衝突時は保守的に再同期＋ユーザー通知。
- カレンダー差分トークン失効 — 失効時にフル再取得し、再取得完了まで同期を一時停止。
- DnD とキーボード操作の両立 — キーボード専用の pick/drop ハンドラとフォーカストラップを用意し、アクセシビリティテストを追加。
- Service Worker 更新による中断 — 更新通知を非モーダルで行い、保存されていない変更がある場合は再同期完了後に再読み込み。

## References
- Google Drive API docs（Files/Changes endpoints）
- Google Calendar API docs（Events + syncToken）
- Workbox offline caching patterns
- dnd-kit keyboard accessibility guidance
