# Design Document

---
**Purpose**: 要件を満たすためのアーキテクチャとインターフェースを定義し、実装ブレを防ぐ。
---

## 用語集
| 正式名称 | 略称 | 種別 | 説明 |
| --- | --- | --- | --- |
| カンバンボード | KanbanBoard | UI（View/Board） | 教科×ステータスの固定グリッドを表示するボード View。 |
| カレンダービュー | CalendarView | UI（View） | 月曜始まりカレンダーと予定/学習時間表示の View。 |
| 閲覧専用ビュー | ReadOnlyView | UI（View） | 閲覧専用モードの View。 |
| アラートバー | AlertToast | UI（Toast） | 同期/PT/過負荷などの非モーダル通知を画面右下のトーストで表示する UI 要素。 |
| ナビゲーション | Navigation | UI | View 切替のメニュー/タブ。 |
| チャート | Chart | UI | グラフ可視化要素（バーンダウンなど）。 |
| View | - | UI | 画面単位の UI。ルーティングで切替。 |
| Panel | - | UI | View 内の設定/補助エリア。 |
| Mode | - | 概念 | 機能/表示の切替状態（viewMode: editable/readonly、TaskDialog 入力モード: 個別/一括 など）。 |

## Overview
学習計画カンバン（LPK）はブラウザ完結の PWA として、教科×ステータスの固定グリッド上でタスクを運用し、オフラインでも編集・計測・同期を継続する。Google Drive を主ストレージ、Google Calendar を予定連携に用い、週次スプリントの計画と日次運用、週次レビューを一貫して支援する。

### Goals
- 固定ステータス列と教科行による2次元カンバンで、ドラッグ操作とダイアログ編集を安全に提供する。
- オフラインファーストのローカルストアと同期エンジンで、Google Drive/Calendar への双方向同期を実現する。
- 時間管理（予定/残り時間、PT、自動計測）と Today 過負荷警告を一貫したロジックで提供する。

### Non-Goals
- バックエンドサーバの新規構築（GitHub Pages 配信のみ）。
- RSC/SSR ベースの UI ランタイム（必要なら別途検討）。
- AI 自動スケジューリングなど要件外の高度機能。

## Architecture

### Existing Architecture Analysis
新規実装（既存コードなし）。ステアリングのスタック方針（React + Vite + TanStack Router + Zustand、PWA、Google API）を前提に設計する。

### Architecture Pattern & Boundary Map
採用: クライアントサイド Clean（Ports/Adapters）＋ローカルストア／同期キュー分離。

```mermaid
graph TB
  subgraph UI
    AppShell[AppShell]
    KanbanBoard[KanbanBoard]
    TaskDialog[TaskDialog]
    Dashboard[Dashboard]
    CalendarView[CalendarView]
    ReadOnlyView[ReadOnlyView]
    HelpPage[HelpPage]
  end
  subgraph State
    TaskStore[TaskStore Zustand]
    StatusPolicy[StatusPolicy]
    TimeCalc[TimeCalc]
    Burndown[Burndown]
    Availability[Availability]
    Pomodoro[PomodoroTimer]
  end
  subgraph Sync
    SyncEngine[SyncEngine]
    DriveAdapter[DriveAdapter]
    CalendarAdapter[CalendarAdapter]
    StorageAdapter[StorageAdapter IndexedDB]
  end
  subgraph Infra
    ServiceWorker[ServiceWorker]
    UpdateManager[UpdateManager]
    Auth[Auth Google]
  end
  KanbanBoard --> TaskStore
  TaskDialog --> TaskStore
  Dashboard --> TaskStore
	  CalendarView --> TaskStore
	  TaskStore --> StatusPolicy
	  TaskStore --> TimeCalc
	  TaskStore --> Burndown
	  TaskStore --> Availability
	  TaskStore --> SyncEngine
  SyncEngine --> StorageAdapter
  SyncEngine --> DriveAdapter
  SyncEngine --> CalendarAdapter
  ServiceWorker --> UpdateManager
```

### Thread / Worker Strategy
- Threads in scope: ブラウザメインスレッド（UI/状態/同期処理）＋ Service Worker（PWA キャッシュとバージョン更新制御）＋ Web Worker（Drive のマージ/差分計算などの CPU 負荷が高い処理）。
- Service Worker で扱うもの: precache/route によるオフラインキャッシュ、バージョン検知と `updatefound/statechange` 監視、`skipWaiting` とクライアントへのリロード要求、簡易なネットワークフェイルオーバー。Push/Periodic Background Sync はサーバレス方針＋Safari 制約のため不採用。
- メインスレッドで扱うもの: UI/状態管理（React+Zustand）、SyncEngine の enqueue/flush/pull、Drive/Calendar API 呼び出し（トークン失効 UI と連携しやすくする）、InProAutoTracker/Pomodoro の計測と通知、Availability/Calendar/Settings 編集（viewMode=readonly では編集無効化）、BackupService の開始/完了通知と UI 進捗。
- Web Worker で扱うもの: Drive の remote→local マージ（差分計算、PrioritySorter 再計算、必要なら Burndown 再計算）、バックアップの zip 圧縮/展開（大きい場合）。UI は操作不能なため、Worker は「状態を直接変更」せず「適用可能な patch（差分）」を返す。
- 採用基準: Service Worker でしかできないキャッシュ/バージョン更新/ネットフェイルオーバーのみ SW へ置き、フォアグラウンド実行が前提の同期・計測・編集ロジックはメインに限定する。バックグラウンドスケジュールやサーバ経由通知が必要になる場合は要件とサーバレス方針を再検討する。

### Technology Stack

| Layer | Choice / Version | Role in Feature | Notes |
|-------|------------------|-----------------|-------|
| Frontend | React 18 + Vite | SPA/PWA UI 実行基盤 | Vite で高速 dev/build、PWA プラグイン想定 |
| State | Zustand | グローバル状態とローカルキャッシュ | ミドル状態を hooks で提供 |
| Routing | TanStack Router | 画面遷移（カンバン/カレンダー/ヘルプ/閲覧専用） | 型安全ルーティング |
| UI | MUI + dnd-kit | コンポーネントと DnD | アクセシビリティ対応前提 |
| Data Store | IndexedDB | オフライン永続と変更キュー保持 | StorageAdapter で抽象化 |
| Sync | Google Drive API / Google Calendar API | 主データ／予定の双方向同期 | Drive は JSON ファイル、Calendar は syncToken 差分 |
| PWA | Service Worker + @vite-pwa/plugin | オフラインキャッシュと強制アップデート | 非モーダル通知で更新 |
| Testing | Vitest + RTL + MSW + Playwright | 単体/統合/E2E | Steering/testing に準拠 |

## System Flows

### タスク移動（DnD）とステータス遷移ガード
```mermaid
sequenceDiagram
  participant U as User
  participant KB as KanbanBoard
  participant SP as StatusPolicy
  participant TS as TaskStore
  participant SE as SyncEngine
  participant IDB as StorageAdapter
  U->>KB: Drag TCard to target cell
  KB->>TS: moveTask(taskId, to, initiator)
  TS->>SP: validateMove({taskId, from, to, context, initiator})
  SP-->>TS: decision {allowed, sideEffects, reason?}
  alt allowed
    TS->>TS: apply state + sideEffects (atomic)
    TS->>IDB: persist(stateSnapshot)  %% StorageAdapter 経由
    TS->>SE: enqueueChange(taskDelta)
    TS-->>KB: ok
  else rejected
    TS-->>KB: PolicyError(reason)
    KB-->>U: show block reason
  end
```
Key: ポリシーは Today→InPro 制約、Done 遷移条件、InPro 唯一性、自動 OnHold を返す。

### オフライン同期サイクル（Drive/Calendar）
```mermaid
sequenceDiagram
  participant TS as TaskStore
  participant SE as SyncEngine
  participant DA as DriveAdapter
  participant CA as CalendarAdapter
  participant IDB as StorageAdapter
  loop periodic/online
    TS->>SE: flushQueuedChanges()
    SE->>DA: upload(taskChanges)
    SE->>CA: applyCalendarChanges()
    DA-->>SE: remoteChanges
    CA-->>SE: calendarDiff
    SE->>TS: merge(remoteChanges, calendarDiff)
    SE->>IDB: persist(stateSnapshot, queueState)
  end
```
Key: syncToken 失効時はフル再取得、競合時は保守的マージ＋ユーザー通知。

### UI 階層構造（コンテナと主要画面）
```mermaid
flowchart TD
  AppShell[AppShell Router]
  Nav[Navigation Tabs/Menu]
  Main[Main View]
  Kanban[KanbanBoard]
  TaskDialog[TaskDialog Modal]
  Calendar[CalendarView]
  Dashboard[Dashboard]
  Burndown[Burndown Chart]
  Settings[SettingsPanel]
  AlertToast[AlertToast Global]

  AppShell --> Nav
  AppShell --> Main
  AppShell --> AlertToast
  Main --> Kanban
  Main --> Calendar
  Main --> Dashboard
  Main --> Settings
  Kanban --> TaskDialog
  Dashboard --> Burndown
```

### UI レイアウト（ASCII スケッチ）

#### KanbanView

- `Menu Button` をクリックすると SettingsPanel を表示する。
- `YYYY-MM-DD HH:MM` をクリックすると Calendar View を表示する。
- `Kanban` と `Dashboard` はトグルで、表示している方をグレーアウトする
- `sync status` は Google Drive との同期状態をアイコンで示す
- `avator` は Google アカウントのアバターを表示
- `Num of Today/Due tasks` は本日実施予定のタスク数と完了したタスクを視覚的に表示する（過去・未来のスプリントを開いている場合は何も表示しない）
- `Estimate/Done Time ` は本日の勉強可能時間と実績時間を視覚的に表示する（過去・未来のスプリントを開いている場合は何も表示しない）
- `Pomodoro Start` をクリックするとポモドーロタイマーが始まる

```
+---------------------------------------------------------------------------------------------+
| AppBar: [Menu Button] [Logo] [YYYY-MM-DD HH:MM] [Kanban | Dashboard] [sync status] [avatar] |
+---------------------------------------------------------------------------------------------+
| Kanban Header: Num of Today/Done Tasks | Estimate/Done Time                [Pomodoro Start] |
+---------+-------------+-------------+---------------+-------------+------------+------------+
|         | Backlog     |    Today    |  InPro        |  OnHold     |   Done     | Won't fix  |
|---------+-------------+-------------+---------------+-------------+------------+------------|
|         |+-----------+|+-----------+|+-------------+|+-----------+|+----------+|+----------+|
| English ||TCard      |||           ||| TCard for   |||           |||          |||          ||
|         |+-----------+|+-----------+|| InPro       ||+-----------+|+----------+|+----------+|
|         |+-----------+|+-----------+||             ||             |+----------+|            |
|         ||           |||           |||             ||             ||          ||            |
|         |+-----------+|+-----------+||             ||             |+----------+|            |
|         |             |+-----------+||             ||             |            |            |
|         |     +       ||           |||             ||             |            |            |
|         |             |+-----------+|+-------------+|             |            |            |
|---------+-------------+-------------+---------------+-------------+------------+------------|
|         |+-----------+|+-----------+|               |             |            |            |
| Math    ||           |||           ||               |             |            |            |
|         |+-----------+|+-----------+|               |             |            |            |
|         |     +       |             |               |             |            |            |
|---------+-------------+-------------+---------------+-------------+------------+------------|
|         |+-----------+|             |               |             |            |            |
| Science ||           ||             |               |             |            |            |
+---------++-----------++-------------+---------------+-------------+------------+------------+
```

#### KanvanView with Pomodoro Timer

- `Pomodoro Timer` が動いているときは、カンバンの右上にオーバーレイ表示する。

```
+---------------------------------------------------------------------------------------------+
| AppBar: [Menu Button] [Logo] [YYYY-MM-DD HH:MM] [Kanban | Dashboard] [sync status] [avatar] |
+---------------------------------------------------------------------------------------------+
| Kanban Header: Num of Today/Done Tasks | Estimate/Done Time         +---------------------+ |
+---------+-------------+-------------+---------------+-------------+ | Pomodoro Time       |
|         | Backlog     |    Today    |  InPro        |  OnHold     | |                     | |
|---------+-------------+-------------+---------------+-------------+ |                     | |
|         |+-----------+|+-----------+|+-------------+|+-----------+| |                     | |
| English ||TCard      |||           |||             |||           || |       Time          | |
|         |+-----------+|+-----------+||             ||+-----------+| |                     | |
|         |+-----------+|+-----------+||             ||             | |                     | |
|         ||           |||           |||             ||             | |                     | |
|         |+-----------+|+-----------+||             ||             | |   Stop    Restart   | |
|         |             |+-----------+||             ||             | +---------------------+ |
|         |     +       ||           |||             ||             |            |            |
|         |             |+-----------+|+-------------+|             |            |            |
|---------+-------------+-------------+---------------+-------------+------------+------------|
|         |+-----------+|+-----------+|               |             |            |            |
| Math    ||           |||           ||               |             |            |            |
|         |+-----------+|+-----------+|               |             |            |            |
|         |     +       |             |               |             |            |            |
|---------+-------------+-------------+---------------+-------------+------------+------------|
|         |+-----------+|             |               |             |            |            |
| Science ||           ||             |               |             |            |            |
+---------++-----------++-------------+---------------+-------------+------------+------------+
```

#### KanbanView with Alert

- 同期/過負荷/PT などの通知は、画面右下の `AlertToast` で非モーダル表示する。

```
+---------------------------------------------------------------------------------------------+
| AppBar: [Menu Button] [Logo] [YYYY-MM-DD HH:MM] [Kanban | Dashboard] [sync status] [avatar] |
+---------------------------------------------------------------------------------------------+
| Kanban Header: Num of Today/Done tasks | Estimate/Done tasks               [Pomodoro Start] |
+---------+-------------+-------------+---------------+-------------+------------+------------+
|         | Backlog     |    Today    |  InProgress   |  OnHold     |   Done     | Won't fix  |
|---------+-------------+-------------+---------------+-------------+------------+------------|
|         |+-----------+|+-----------+|+-------------+|+-----------+|+----------+|+----------+|
| English ||TCard      |||           |||             |||           |||          |||          ||
|         |+-----------+|+-----------+||             ||+-----------+|+----------+|+----------+|
|         |+-----------+|+-----------+||             ||             |+----------+|            |
|         ||           |||           |||             ||             ||          ||            |
|         |+-----------+|+-----------+||             ||             |+----------+|            |
|         |             |+-----------+||             ||             |            |            |
|         |     +       ||           |||             ||             |            |            |
|         |             |+-----------+|+-------------+|             |            |            |
|---------+-------------+-------------+---------------+-------------+----- +-----+----------+ |
|         |+-----------+|+-----------+|               |             |      | Alert Toast 1  | |
| Math    ||           |||           ||               |             |      |                | |
|         |+-----------+|+-----------+|               |             |      +----------------+ |
|         |     +       |             |               |             |      +----------------+ |
|---------+-------------+-------------+---------------+-------------+----- | Alert Toast 2  | |
|         |+-----------+|             |               |             |      |                | |
| Science ||           ||             |               |             |      +----------------+ |
+---------++-----------++-------------+---------------+-------------+------------+------------+
```

#### KanbanView with Task Dialog

- `Task Dialog` はカンバンの中央に表示され、D&Dで移動可能。ダイアログ外をクリックするとダイアログはキャンセル扱いで閉じる。

```
+---------------------------------------------------------------------------------------------+
| AppBar: [Menu Button] [Logo] [YYYY-MM-DD HH:MM] [Kanban | Dashboard] [sync status] [avatar] |
+---------------------------------------------------------------------------------------------+
| Kanban Header: Num of Today/Done Tasks | Estimate/Done Time                [Pomodoro Timer] |
+---------+-------------+-------------+---------------+-------------+------------+------------+
|         | Backlog     |    Today    |  InPro        |  OnHold     |   Done     | Won't fix  |
|---------+-------------+-------------+---------------+-------------+------------+------------|
|         |+-----------+|+-----------+|+-------------+|+-----------+|+----------+|+----------+|
| English ||TCard      |||         +----------------------+        |||          |||          ||
|         |+-----------+|+-------- | Task Dialog          | -------+|+----------+|+----------+|
|         |+-----------+|+-------- |                      |         |+----------+|            |
|         ||           |||         |                      |         ||          ||            |
|         |+-----------+|+-------- |                      |         |+----------+|            |
|         |             |+-------- |                      |         |            |            |
|         |     +       ||         |                      |         |            |            |
|         |             |+-------- |                      |         |            |            |
|---------+-------------+--------- |                      | --------+------------+------------|
|         |+-----------+|+-------- |                      |         |            |            |
| Math    ||           |||         |                      |         |            |            |
|         |+-----------+|+-------- |                      |         |            |            |
|         |     +       |          |                      |         |            |            |
|---------+-------------+--------- |                      | --------+------------+------------|
|         |+-----------+|          +----------------------+         |            |            |
| Science ||           ||             |               |             |            |            |
+---------++-----------++-------------+---------------+-------------+------------+------------+
```

#### TCard

- TCard は縦に複数並ぶので横長で表示する。
- InPro 以外の TCard は、タイトルと期日（曜日）と予定/実績時間のゲージを表示する。
- `Planned/Spent Time` は体力ゲージ風の棒グラフで `■■■□□` のように予定時間と実績時間を可視化する（残り時間の数値は表示しない）。
- `Due Day of Week` はタスクの期日を曜日で表示する（期日がなければ表示しない）。
- `[icon]` はカレンダーアイコンで、期日が本日なら赤色で表示する（期日がなければ表示しない）。

```
+----------------------------------------+
|  Task Title     Planned/Spent Time     |
|                 [icon] Due Day of Week |
+----------------------------------------+
```

#### TCard (InPro)

- InPro の TCard は正方形で表示し、1 件のみ存在する。
- 中央に 1 分ごとに進行する円状プログレスインジケーターを表示し、円内に経過時間［分］を表示する。
- 予定/実績ゲージは InPro 用の表示として同じカード内に保持する。

```
+------------------------------+
|          Task Title          |
|------------------------------|
|         ( Circle )           |
|        Progress Ring         |
|            25 min            |
|------------------------------|
|    Planned/Spent Time        |
|    ■■■■■□□□□□□    |
|   [icon] Due Day of Week     |
+------------------------------+
```

#### Task Dialog

- `Spent Time` の `[+]` ボタンをクリックすると実績を記録できる。
- `Spent Time` の中には、実績をリストで表示する。

```
+--------------------------+
| +----------------------+ |
| | Task title           | |
| |----------------------| |
| | Description          | |
| |                      | |
| |                      | |
| |                      | |
| |                      | |
| |                      | |
| |----------------------| |
| | Planned Time         | |
| |----------------------| |
| | Spent Time      [+]  | |
| | +------------------+ | |
| | |Day & Time        | | |
| | +------------------+ | |
| | |Day & Time        | | |
| | +------------------+ | |
| |----------------------| |
| | dueDate              | |
| +----------------------+ |
| +---+    +--------+----+ |
| |Del|    | Cancel | OK | |
| +---+    +--------+----+ |
+--------------------------+
```

#### CalendarVIew

```
+---------------------------------------------------------------------------------------------+
| AppBar: [Menu Button] [Logo] [YYYY-MM-DD HH:MM] [Kanban | Dashboard] [sync status] [avatar] |
+---------------------------------------------------------------------------------------------+
| +----------------------------------------+ +----------------------------------------------+ |
| | Calendar                               | | Weekly Progress Panel                        | |
| |                                        | |                                              | |
| |                                        | |                                              | |
| |                                        | |                                              | |
| |                                        | |                                              | |
| |                                        | |                                              | |
| |                                        | |                                              | |
| |                                        | |                                              | |
| |                                        | +----------------------------------------------+ |
| |                                        | +----------------------------------------------+ |
| |                                        | | Details for YY/MM                            | |
| |                                        | |                                              | |
| |                                        | |                                              | |
| |                                        | |                                              | |
| |                                        | |                                              | |
| |                                        | |                                              | |
| |                                        | |                                              | |
| |                                        | |                                              | |
| |                                        | |                                              | |
| +----------------------------------------+ +----------------------------------------------+ |
+---------------------------------------------------------------------------------------------+
```

#### DashboardView

```
+---------------------------------------------------------------------------------------------+
| AppBar: [Menu Button] [Logo] [YYYY-MM-DD HH:MM] [Kanban | Dashboard] [sync status] [avatar] |
+---------------------------------------------------------------------------------------------+
| Dashboard View                                                                              |
| +-----------------------------------------+ +---------------------------------------------+ |
| | Summary by Subject                      | | Summary by Day                              | |
| |                                         | |                                             | |
| |                                         | |                                             | |
| |                                         | |                                             | |
| |                                         | |                                             | |
| |                                         | |                                             | |
| |                                         | |                                             | |
| |                                         | |                                             | |
| |                                         | |                                             | |
| +-----------------------------------------+ +---------------------------------------------+ |
| +-----------------------------------------------------------------------------------------+ |
| | Burndown Chart                                                                          | |
| |                                                                                         | |
| |                                                                                         | |
| |                                                                                         | |
| |                                                                                         | |
| |                                                                                         | |
| |                                                                                         | |
| +-----------------------------------------------------------------------------------------+ |
+---------------------------------------------------------------------------------------------+
```

#### Settings Panel over KanbanView

- `Settings Panel` は KanbanView や DashboardView にオーバーレイ表示する

```
+---------------------------------------------------------------------------------------------+
| +--------------------------------+ MM-DD HH:MM] [Kanban | Dashboard] [sync status] [avatar] |
+ | Settings Panel                 | ---------------------------------------------------------+
| |                                | sks | Estimate/Done Time                [Pomodoro Start] |
+ |                                | -+---------------+-------------+------------+------------+
| |                                |  |  InPro        |  OnHold     |   Done     | Won't fix  |
| |                                | -+---------------+-------------+------------+------------|
| |                                | +|+-------------+|+-----------+|+----------+|+----------+|
| |                                | |||             |||           |||          |||          ||
| |                                | +||             ||+-----------+|+----------+|+----------+|
| |                                | +||             ||             |+----------+|            |
| |                                | |||             ||             ||          ||            |
| |                                | +||             ||             |+----------+|            |
| |                                | +||             ||             |            |            |
| |                                | |||             ||             |            |            |
| |                                | +|+-------------+|             |            |            |
| |                                | -+---------------+-------------+------------+------------|
| |                                | +|               |             |            |            |
| |                                | ||               |             |            |            |
| |                                | +|               |             |            |            |
| |                                |  |               |             |            |            |
| |                                | -+---------------+-------------+------------+------------|
| |                                |  |               |             |            |            |
| +--------------------------------+  |               |             |            |            |
+---------++-----------++-------------+---------------+-------------+------------+------------+
```

## Requirements Traceability

| Requirement | Summary | Components | Interfaces | Flows |
|-------------|---------|------------|------------|-------|
| 1.1 | 固定ステータス列と教科行でボード構成 | KanbanBoard, TaskStore | StatusPolicy | タスク移動 |
| 1.2 | スプリント1週固定で開始/終了日表示 | SprintSelector, Dashboard | TaskStore | - |
| 1.3 | 初期表示はカンバンのみ | AppShell, KanbanBoard | Router | - |
| 1.4 | ステータス列ロック | KanbanBoard | StatusPolicy | タスク移動 |
| 1.5 | ステータス表示名設定のみ許可 | SettingsStore | Settings API | - |
| 1.6 | 教科順変更をスプリント単位保存 | TaskStore | StorageAdapter | - |
| 1.7 | タスクある教科は削除不可 | TaskStore | StatusPolicy | - |
| 1.8 | Backlog プラスで作成ダイアログ | KanbanBoard, TaskDialog | - | - |
| 1.9 | 空セルドラッグでスクロール＆ヘッダー固定 | KanbanBoard | - | - |
| 2.1 | 新規 TDialog で属性入力保存（優先度は D&D で変更） | TaskDialog | TaskStore | - |
| 2.2 | 既存 Task 読込編集保存 | TaskDialog | TaskStore | - |
| 2.3 | TCard にタイトル/期日/予定/実績/ゲージ | TaskCard | TimeCalc | - |
| 2.4 | ダイアログでタイトルに初期フォーカス | TaskDialog | - | - |
| 2.5 | Tab 移動 | TaskDialog | - | - |
| 2.6 | 保存: Ctrl+Enter/ボタン, Esc/キャンセル | TaskDialog | - | - |
| 2.7 | 保存/キャンセル/消去操作 | TaskDialog | TaskStore | - |
| 2.8 | 日付別実績累積表示 | TaskDialog | TimeCalc | - |
| 2.9 | 実績の手動修正許可 | TaskDialog | TaskStore | - |
| 3.1 | ステータス/教科間ドラッグで移動保存 | KanbanBoard, TaskStore | StatusPolicy | タスク移動 |
| 3.2 | ドラッグ中に有効セルをハイライト | KanbanBoard | StatusPolicy | タスク移動 |
| 3.3 | セル内優先度順ソート | KanbanBoard | PrioritySorter | - |
| 3.4 | セル内並び替えを保存 | TaskStore | StorageAdapter | - |
| 3.5 | マウス/タッチ両方サポート | KanbanBoard | DnD API | - |
| 3.6 | TCard 横長、InPro 正方形 | TaskCard | - | - |
| 3.7 | InPro は常に1件で積み上げなし | StatusPolicy, TaskCard | - | タスク移動 |
| 3.8 | Today 最優先以外→InPro 禁止 | StatusPolicy | - | タスク移動 |
| 3.9 | InPro のみ1件、他は OnHold へ自動移動 | StatusPolicy, TaskStore | - | タスク移動 |
| 3.10 | InPro/OnHold 以外→Done 禁止 | StatusPolicy | - | タスク移動 |
| 3.11 | Today/InPro/OnHold 残り時間超過で警告 | AlertToast, Availability, TimeCalc | - | - |
| 3.12 | InPro 自動計測＋円形インジケータ | PomodoroTimer, TaskCard | TimeCalc | - |
| 3.13 | PT 操作と通知 | PomodoroTimer, AlertToast | - | - |
| 3.14 | PT 終了時アラーム | PomodoroTimer, AlertToast | - | - |
| 4.1 | Dashboard で週次集計を表示 | Dashboard | Burndown | - |
| 4.2 | 今日期日 Backlog 強調 | KanbanBoard | TimeCalc | - |
| 4.3 | 期日超過フラグ/リスト | Dashboard | TimeCalc | - |
| 4.4 | バーンダウンチャート | Dashboard | Burndown | - |
| 4.5 | 月曜始まりカレンダー選択 | CalendarView | Router | カレンダーフロー |
| 4.6 | Calendar 予定取得し表示（学習可能時間は自動反映しない） | CalendarView | CalendarAdapter, Availability | カレンダーフロー |
| 4.7 | LPK カレンダー更新を Google Calendar に反映 | CalendarView | CalendarAdapter | カレンダーフロー |
| 4.8 | 特定日ビューで3種のタスク一覧 | CalendarView | TaskStore | - |
| 4.9 | 曜日ごとの作業可能時間デフォルト | Availability | SettingsStore | - |
| 4.10 | 特定日上書き | Availability | TaskStore | - |
| 4.11 | 予定を表示して学習可能時間調整の参考にする（自動反映なし） | Availability | CalendarAdapter | カレンダーフロー |
| 4.12 | 当日の予定と、手入力の学習可能時間に基づく残り学習可能時間ゲージ表示 | KanbanBoard | Availability, TimeCalc | - |
| 4.13 | 教科別完了数/時間の週次サマリ | Dashboard | Burndown, TimeCalc | - |
| 4.14 | 当日追加タスクのみ表示 | CalendarView | TaskStore | - |
| 4.15 | ヘルプページ提供（SettingsPanel から起動） | HelpPage, SettingsPanel | Router | - |
| 4.16 | 予定/実績時間グラフ表示 | CalendarView | TimeCalc | - |
| 5.1 | PWA インストール、主要ブラウザ対応 | AppShell, ServiceWorker | UpdateManager | - |
| 5.2 | GitHub Pages 配信 | Build/Hosting | - | - |
| 5.3 | Google サインインで Drive 保存 | Auth, DriveAdapter | SyncEngine | - |
| 5.4 | オンライン時ローカルキャッシュ＋随時/定期同期 | TaskStore, SyncEngine | StorageAdapter | 同期フロー |
| 5.5 | オフライン操作と再接続同期 | TaskStore, SyncEngine | StorageAdapter | 同期フロー |
| 5.6 | 同期状態の非モーダル通知と再試行 | AlertToast, SyncEngine | - | 同期フロー |
| 5.7 | サーバレス構成（Pages＋Drive） | Architecture | - | - |
| 5.8 | バージョンチェックと自動アップデート | UpdateManager | ServiceWorker | 更新フロー |
| 5.9 | 強制アップデート | UpdateManager | ServiceWorker | 更新フロー |
| 5.10 | Drive 複数ファイルは専用ディレクトリ | DriveAdapter | - | - |
| 5.11 | 将来の API 拡張性 | SyncEngine, TaskStore | Ports | - |
| 5.12 | gh スクリプトで保護/マージ方式/Pages 設定 | RepoSetupScript | GitHub API | - |
| 5.13 | データバックアップとローテーション | SyncEngine, DriveAdapter, StorageAdapter | - | - |
| 6.1 | 閲覧専用リンク/権限 | ReadOnlyView, Auth | Router | - |
| 6.2 | 閲覧専用 PWA モード | ReadOnlyView | ServiceWorker | - |
| 6.3 | 閲覧モードの自動更新/オフライン表示 | ReadOnlyView, SyncEngine | StorageAdapter | 同期フロー |
| 6.4 | 招待無効化で閲覧遮断 | Auth, Router | - | - |
| 7.1 | WCAG 2.1 AA 準拠 | 全 UI | A11y API | - |
| 7.2 | キーボードナビゲーション | KanbanBoard, TaskDialog, CalendarView | A11y API | - |
| 7.3 | 適切な ARIA 属性 | 全 UI | A11y API | - |
| 7.4 | 言語切替（JA/EN） | AppShell, i18n | - | - |
| 7.5 | 設定永続 | SettingsStore | StorageAdapter | - |
| 8.1 | main push で自動テスト | CI | - | - |
| 8.2 | テスト成功でビルド | CI | - | - |
| 8.3 | ビルド成功で Pages デプロイ | CI | - | - |
| 8.4 | デプロイ結果通知 | CI | - | - |
| 9.1 | Dev Container で開発環境構築 | DevContainer | - | - |
| 9.2 | 依存関係プリインストール | DevContainer | - | - |
| 9.3 | 推奨拡張自動導入 | DevContainer | - | - |

## Components and Interfaces

### Summary Table
| Component | Domain/Layer | Intent | Req Coverage | Key Dependencies (P0/P1) | Contracts |
|-----------|--------------|--------|--------------|--------------------------|-----------|
| AppShell | UI | ルーティングとシェル、閲覧モード切替 | 1.3,6.1,7.4 | Router (P0), ServiceWorker (P1) | State |
| KanbanBoard | UI | 教科×ステータスグリッドと DnD | 1.x,3.x,4.2,4.12 | StatusPolicy (P0), TaskStore (P0), DnD Kit (P1) | State |
| TaskCard | UI | タスク表示（ゲージ/円形インジケータ） | 2.3,3.6,3.12 | TimeCalc (P0), PomodoroTimer (P1), InProAutoTracker (P0) | State |
| TaskDialog | UI | 作成/編集/消去と入力制御 | 1.8,2.x | TaskStore (P0) | Service |
| Dashboard | UI | 週次集計・バーンダウン | 4.1,4.3,4.4,4.13 | Burndown (P0) | State |
| SettingsPanel | UI | ステータス表示名と言語を設定し、バージョン/アップデート状態、PT デフォルト時間、手動同期、ヘルプ導線を提供 | 1.5,7.4,5.8,5.9,5.14,3.13,5.6,4.15 | TaskStore (P0), UpdateManager (P1), SyncEngine (P1) | State |
| CalendarView | UI | 月曜始まりカレンダーと予定/学習時間表示 | 4.5-4.16 | CalendarAdapter (P0), Availability (P0) | State |
| HelpPage | UI | 操作説明 | 4.15 | - | - |
| AlertToast | UI | 非モーダル通知（トースト: 同期/PT/過負荷） | 3.11,3.13,4.6,5.6,5.8 | SyncEngine (P0), TimeCalc (P0) | State |
| TaskStore | State | タスク/教科/スプリント状態と IndexedDB 永続 | 全般 | StorageAdapter (P0), SyncEngine (P0) | State |
| StatusPolicy | Domain | ステータス遷移ガードと副作用計算 | 1.4,3.x | - | Service |
| PrioritySorter | Domain | セル内優先度（並び順）正規化 | 3.3,3.4 | TaskStore (P1) | Service |
| InProAutoTracker | Domain | InPro 滞在中の自動実績反映 | 3.12 | TaskStore (P0) | Service |
| TimeCalc | Domain | 残り時間計算と Today 負荷 | 2.3,3.11,4.2,4.12 | TaskStore (P1) | Service |
| Burndown | Domain | バーンダウン計算と週次サマリ | 4.1,4.4,4.13 | TaskStore (P1) | Service |
| Availability | Domain | 学習可能時間（予定/上書き/曜日）計算 | 4.6,4.9-4.12 | CalendarAdapter (P1), SettingsStore (P1) | Service |
| PomodoroTimer | Domain | PT 計測と通知 | 3.12-3.14 | AlertToast (P1) | Service |
| SyncEngine | Sync | 変更キューと双方向同期 | 5.3-5.6,6.3 | DriveAdapter (P0), CalendarAdapter (P0), StorageAdapter (P0) | Service |
| BackupService | Sync | バックアップ取得・保持・復元 | 5.13 | DriveAdapter (P0), StorageAdapter (P0) | Service |
| DriveAdapter | Integration | Drive API 呼び出し | 5.3,5.10 | Auth (P0) | API |
| CalendarAdapter | Integration | Calendar API 呼び出し | 4.6-4.12 | Auth (P0) | API |
| StorageAdapter | Infra | IndexedDB CRUD | 5.4,5.5 | - | Service |
| UpdateManager | Infra | バージョン検知と強制アップデート | 4.1,5.8,5.9 | ServiceWorker (P0) | Service |
| Auth | Infra | Google 認証とトークン管理 | 5.3,6.1 | Google OAuth (P0) | Service |
| DevContainer/CI | Tooling | 開発用コンテナ（ビルド/実装/テストを同一環境で実施）と CI/CD | 8.x,9.x | - | - |
| RepoSetupScript | Tooling | gh コマンドでブランチ保護・マージ方式・Pages 設定を適用 | 5.12 | GitHub API (P0) | Service |

### UI Layer

**View Mode 管理**
- ソース: AppShell/Router が Auth 完了後に対象データフォルダ（`dataFolderId`）への権限を確認し `viewMode: 'editable' | 'readonly'` を決定する（閲覧専用は全画面共通のモード）。
  - `sharedFolderId` が指定されている場合（学習者が発行した Google Drive の LPK フォルダ共有リンク由来）、`dataFolderId = sharedFolderId` として読み取り専用（readonly）で開く。
  - 指定が無い場合は、ユーザー自身の Google Drive 上で `/LPK/` フォルダ（アプリ専用ディレクトリ）を解決し、読み書き可能なら editable とする。読み取りのみの場合は readonly とする。
- 伝播: viewMode をコンテキストまたは props で各画面（KanbanBoard/TaskDialog/CalendarView/Dashboard/SettingsPanel/Availability 等）へ渡し、編集操作をガードする。CalendarView での予定追加/更新、Availability の学習可能時間上書き、SettingsPanel のラベル/言語/更新操作も無効化する。
- 永続化: viewMode は一時的なアクセスモードであり、settings/sprint には保存しない。

#### KanbanBoard
| Field | Detail |
|-------|--------|
| Intent | 教科×ステータス固定グリッド、DnD 操作を提供 |
| Requirements | 1.1-1.9,3.1-3.8,4.2,4.12 |
| Contracts | State |

**Responsibilities & Constraints**
- ステータス列と教科行を固定し、スクロール時もヘッダー/左列をピン留め。
- DnD は StatusPolicy の判定結果に従い、ドラッグ中に有効セルのみをハイライトし、無効セルではドロップを受け付けず元の位置に戻す。
- 空セルドラッグでスクロール補助、Backlog プラスから TaskDialog を起動。
- viewMode が readonly の場合は DnD/ダイアログ起動など編集操作を無効化し、表示のみとする。Subject 行の並べ替え/追加/削除も禁止。

**Dependencies**
- Inbound: Router — 表示切替 (P2)
- Outbound: StatusPolicy — 遷移可否/副作用取得 (P0); TaskStore — 状態更新 (P0); PrioritySorter — 優先度（並び順）正規化 (P1); TimeCalc — ゲージ/警告 (P1)
- External: dnd-kit — DnD 実装 (P1)

**Implementation Notes**
- Integration: キーボード pick/drop を専用ハンドラで用意し、マウス/タッチと共存。
- Validation: ドロップ前に StatusPolicy の結果を確認、警告は AlertToast へ。
- Risks: 大量カードで描画負荷→縦スクロール主体のため「教科行（row）単位のバーチャライゼーション（仮想スクロール）」を第一候補とする。1 行は「教科名セル＋6 ステータスセルの横並び」をひとかたまりで仮想化し、固定ヘッダー/左列と共存させる。特定教科にカードが偏在する場合のみ、当該行内のステータス列リストの部分バーチャライゼーションを補助的に検討する（DnD 中は対象行/列を非仮想化するフォールバックを許容）。

#### TaskDialog
| Field | Detail |
|-------|--------|
| Intent | タスク作成/編集/消去をフォーム操作で行う（個別追加と一括追加を切替可能） |
| Requirements | 1.8,2.x |
| Contracts | Service |

**Responsibilities & Constraints**
- タイトル初期フォーカス、Tab ナビゲーション、Ctrl+Enter/Enter 保存、Esc/キャンセル。
- 実績時間は日付別に編集可能、累積表示。
- 優先度は TaskDialog では変更せず、TCard の D&D でのみ変更する。新規 Task は対象セルの最下位（最低優先度）に追加する。
- viewMode が readonly の場合は全入力を無効化し表示専用とする。
- InPro 滞在中の自動実績加算は InProAutoTracker が担い、PomodoroTimer とは独立運用する（Pomodoro は通知・休憩管理に専念）。
- Backlog から起動する場合は教科が自明なため、教科入力なしで作成する。ダイアログ内で「個別追加（詳細入力）」と「一括追加（複数行テキストで1行=1タスク、タイトルのみ）」を切替でき、選択状態を記憶する。一括作成後の詳細編集は通常の TCard 編集で行う。

**Dependencies**
- Outbound: TaskStore — CRUD (P0); TimeCalc — 残り時間計算 (P1)

**Contracts**: Service [x] / API [ ] / Event [ ] / Batch [ ] / State [ ]
```typescript
// タスク作成・更新・削除を扱うダイアログ向けサービス
interface TaskDialogService {
  createTask(input: TaskInput): Result<TaskId, ValidationError>; // 必須項目を検証し新規作成
  updateTask(taskId: TaskId, input: TaskInput): Result<void, ValidationError>; // 既存タスクを更新
  deleteTask(taskId: TaskId): Result<void, Error>; // タスクを消去
}
```
- Preconditions: 必須フィールド（タイトル、期日、教科、ステータス）を検証。
- Postconditions: TaskStore に反映し、必要なら同期キューへ enqueue。

**Implementation Notes**
- Integration: フォーカストラップと aria-modal、aria-labelledby を設定。
- Risks: 大量フィールドでの入力遅延→遅延保存を避け即時バリデーション。

#### Dashboard
| Field | Detail |
|-------|--------|
| Intent | 週次集計、バーンダウン |
| Requirements | 4.1,4.3,4.4,4.13 |
| Contracts | State |

**Responsibilities & Constraints**
- バーンダウン計算、期日超過リスト、教科別完了/学習時間集計。
- viewMode が readonly の場合は閲覧のみとし、編集/保存操作は提供しない。

**Dependencies**
- Outbound: Burndown (P0); TimeCalc (P1); TaskStore (P0)

**Implementation Notes**
- Integration: グラフは日次サマリをキャッシュし、表示時に再計算を避ける。
- Risks: スプリント境界跨ぎの集計漏れ→日付判定ユーティリティを共通化。

#### CalendarView
| Field | Detail |
|-------|--------|
| Intent | 月曜始まりカレンダーと学習可能時間表示、予定双方向同期 |
| Requirements | 4.5-4.16 |
| Contracts | State |

**Responsibilities & Constraints**
- 特定日ビューで実施/期日/追加タスクを表示。
- Google Calendar 予定を取得して表示し、ユーザーが dayDefaultAvailability/当日上書き値を手動調整する際の参考情報として提示（自動控除はしない）。
- LPK 側の予定追加/更新を CalendarAdapter 経由で同期。
- viewMode が readonly の場合は予定追加/編集を無効化し、閲覧のみとする。CalendarAdapter への書き込み API は呼ばない。

**Dependencies**
- Outbound: CalendarAdapter (P0); Availability (P0); TaskStore (P0); SyncEngine (P1)

**Implementation Notes**
- Integration: syncToken 失効時は全件再取得し、UI に再取得中を表示。
- Risks: タイムゾーン差異による日付ずれ→ UTC 保持＋表示時ローカル変換。


#### SettingsPanel
| Field | Detail |
|-------|--------|
| Intent | ステータス表示名と言語設定、バージョン/アップデート状態の確認、手動同期/ヘルプ導線 |
| Requirements | 1.5,7.4,5.8,5.9,5.14,3.13,5.6,4.15 |
| Contracts | State |

**Responsibilities & Constraints**
- 固定ステータス集合を前提に、表示名のみを編集可能（追加/削除/並べ替え不可）。言語切替を提供。
- バージョン表示とアップデート状態（強制更新含む）を表示し、手動「更新を確認」アクションで UpdateManager.checkForUpdate を起動。新版があれば Service Worker を更新し、強制/通常の別に応じて `skipWaiting`/リロードを制御する。
- 手動同期のトリガー（例: 「今すぐ同期」ボタン）を提供し、SyncEngine.flush を明示実行できる。
- HelpPage を開く導線を提供する（SettingsPanel から遷移/ダイアログ表示）。
- pendingQueue が空でない場合は flush を試行し、成功後にリロード。失敗/オフライン時はリロードを遅延し、ユーザーが明示的に「バックアップして強制リロード」を選んだ場合のみ同期前リロードを許可する。
- PT のデフォルト作業/休憩時間を設定可能にする（タスク実績には影響させない）。
- viewMode が readonly の場合は表示専用とし、ステータスラベル/言語/学習可能時間設定/バックアップ/復元などの編集は無効化する。ただし「更新を確認」は許可し、検出時の更新・リロードフローは実行できる。
- バックアップ/リストア UI を提供し、BackupService を経由して daily/weekly の取得・復元を実行する（一覧表示→選択→確認→実行）。実行中は pendingQueue 停止と進捗表示を行う。
- viewMode=readonly の場合、手動バックアップ/復元操作は無効化（表示のみ）とする。
- 閲覧専用モードの自動更新間隔（Drive/Calendar からの pull）を設定可能にする（デフォルト 1 分）。編集不可のためローカルキューは持たず、pull のみを行う。
- 閲覧招待の発行: Google Drive の LPK フォルダを「リンクを知っている全員（閲覧者）」として共有し、共有リンクをコピーできるようにする（招待リンクの実体は Drive の共有リンク）。
- 招待無効化: 上記のリンク共有を解除し、共有リンク経由の閲覧を遮断する。

**Dependencies**
- Outbound: TaskStore (settings 永続) (P0); UpdateManager (バージョン/アップデート状態) (P1)

**Implementation Notes**
- Integration: 入力バリデーション（空/重複不可）。固定集合から外れる更新は拒否。
- Risks: 設定変更と同期競合→ settings を queue に反映し、競合時は更新時刻で解決。



### Domain/State Layer

#### TaskStore (Zustand + IndexedDB)
| Field | Detail |
|-------|--------|
| Intent | タスク/教科/スプリント/設定の単一信頼ソース |
| Requirements | 全般 |
| Contracts | State |

**Responsibilities & Constraints**
- ローカル状態と IndexedDB 永続、変更キュー生成。
- 教科順/ステータスラベル/言語設定の保存。
- viewMode=readonly の場合、編集 API を reject し、pendingQueue への enqueue を禁止する（読み取り専用）。Settings/Availability/Calendar の書き込みリクエストも同様に拒否。
- InProAutoTracker と連携し、InPro 滞在中のタスクに 1 分刻みで実績を自動加算。バックグラウンド復帰時は経過差分で補正し、退出時（他ステータスへ移動/別タスクが InPro に入る/タブ終了）に最終加算する。実績追加は pendingQueue に enqueue し、オフラインでも蓄積。
- **moveTask 処理手順（原子性）**
  1. `MoveInput` を構築する（`from`/`to`/`priority`/`to.insertIndex` に加え、`context` を Availability/TimeCalc/現状態から算出）。
  2. `StatusPolicy.validateMove` を呼び、許可/拒否と `sideEffects` を取得する。
  3. 許可の場合のみ、同一 reducer 内で「移動後の状態」と `sideEffects` の適用結果を生成する。
  4. 生成した新状態を 1 トランザクションで `StorageAdapter`（IndexedDB）へ commit する。
  5. commit 成功後に差分を `pendingQueue` に enqueue し、`SyncEngine` に通知する。拒否の場合は状態変更も enqueue も行わない。

**Dependencies**
- Outbound: StorageAdapter (P0); SyncEngine (P0); StatusPolicy (P1); PrioritySorter (P1)

**Contracts**: State [x]
```typescript
// グローバル状態のスナップショット（Sprint に burndownHistory を含む）
interface TaskStoreState {
  tasks: Record<TaskId, Task>; // タスク本体
  subjects: Subject[]; // 教科
  sprint: Sprint; // 現在スプリント
  settings: UserSettings; // 表示設定・言語など
  pendingQueue: ChangeRecord[]; // 同期待ちキュー
}
// 状態変更のための操作群
interface TaskStoreActions {
  upsertTask(task: Task): void; // 作成または更新（upsert = update or insert: 存在すれば更新・無ければ作成）
  moveTask(taskId: TaskId, to: StatusSlot): Result<SideEffects, PolicyError>; // ステータス/教科移動（ドロップ位置を含む）
  reorderTasks(subjectId: SubjectId, status: Status, order: TaskId[]): void; // セル内並び替え（優先度更新）
  recordActual(taskId: TaskId, entry: ActualEntry): void; // 実績時間の追記
  setSubjectOrder(subjectIds: SubjectId[]): void; // 教科順の更新
}

// 目的セル（教科×ステータス）と、挿入位置（ドロップ位置）
type StatusSlot = {
  subjectId: SubjectId;
  status: Status;
  insertIndex?: number; // 0=最上位。省略時は最下位へ挿入する
};

// StatusPolicy から返され、TaskStore が適用する副作用の最小集合
type SideEffect =
  | { kind: 'autoMoveToOnHold'; taskId: TaskId } // InPro 置換時の自動退避
  | { kind: 'startInProTracking'; taskId: TaskId }
  | { kind: 'stopInProTracking'; taskId: TaskId }
  | { kind: 'recordActual'; taskId: TaskId; minutes: number; at: ISODateTime }
  | { kind: 'normalizePriorities'; subjectId: SubjectId; status: Status } // セル内順序に合わせて priority をギャップ付きで再採番
  | { kind: 'updateBurndown'; date: ISODate };
type SideEffects = SideEffect[];

// 副作用の適用順序（同一 reducer 内で上から順に実行）
// 1) autoMoveToOnHold / stopInProTracking → 2) startInProTracking → 3) recordActual
// → 4) normalizePriorities → 5) updateBurndown
```

**Implementation Notes**
- Integration: IndexedDB スキーマにバージョンを付与し、マイグレーション手順を持つ。
- Risks: 大量タスク時のシリアライズ負荷→差分保存とスナップショット頻度を調整。

#### StatusPolicy
| Field | Detail |
|-------|--------|
| Intent | ステータス遷移の可否判定と副作用生成 |
| Requirements | 1.4,3.1-3.10 |
| Contracts | Service |

**Contracts**: Service [x]
```typescript
// ステータス遷移の可否と副作用を判定
interface StatusPolicyService {
  validateMove(input: MoveInput): MoveDecision; // 許可/拒否と副作用を返す（純粋判定）
}
// タスク移動の入力（TaskStore から必要なコンテキストを明示的に渡す）
type MoveInput = {
  taskId: TaskId;
  from: { subjectId: SubjectId; status: Status; priority: number }; // Today→InPro 判定に優先度を使用（自動 OnHold も Today 時の優先度を保持）
  to: { subjectId: SubjectId; status: Status; insertIndex?: number }; // D&D のドロップ位置（0=最上位）。省略時は最下位へ挿入し priority を更新する
  context: {
    hasOtherInPro: boolean; // 既に InPro が存在するか（同時に 1 件のみ）
    todayPlannedMinutes: number; // Today に積まれている予定時間合計
    availableMinutesToday: number; // 本日の学習可能時間（Availability 結果）
    dueAt?: ISODate; // 期日（Done/WontFix ガードなどに利用）
  };
  initiator?: 'mouse' | 'touch' | 'keyboard';
};
type MoveDecision =
  | { allowed: true; sideEffects: SideEffect[] }
  | { allowed: false; reason: PolicyError };
```
- Preconditions: 固定ステータス集合外の遷移は即拒否。
- Postconditions: 副作用（InPro 置換→元を OnHold へ、Done ガード）を返却。

**Dependencies**
- Inbound: KanbanBoard (P0)
- Outbound: なし（TaskStore 依存を持たない純粋サービス）

**Implementation Notes**
- Risks: ポリシー更新時のリグレッション→ユニットテスト必須。

#### PrioritySorter
| Field | Detail |
|-------|--------|
| Intent | セル内の優先度（並び順）正規化とソート |
| Requirements | 3.3,3.4 |
| Contracts | Service |

**Implementation Notes**
- Integration: セル内順序のソースは `Task.priority`（ギャップ付き rank）とし、表示は `priority` の降順（同値は `updatedAt`→`taskId`）で決定する。DnD による並び替え/別セル移動（ドロップ位置挿入）では、通常は「移動した 1 件」の `priority` のみを更新する（隣接 2 件の `priority` の中間値、先頭/末尾は `PRIORITY_STEP` の加算/減算で付与）。挿入先でギャップが無い（例: 中間値が作れない）場合や同値が発生した場合は、当該セル内を PrioritySorter で正規化し、上から `0, -PRIORITY_STEP, -2*PRIORITY_STEP...` のようにギャップを再付与する。
- 定数: `PRIORITY_STEP = 1024`（整数）
- Risks: 並び順の競合（他端末更新）→ 競合で `priority` が同値になった場合は tie-break で表示を安定化し、同期後に当該セルのみ正規化して同値を解消する。

#### TimeCalc
| Field | Detail |
|-------|--------|
| Intent | 予定/残り時間、Today 負荷、期日強調を計算 |
| Requirements | 2.3,3.11,4.2,4.12,4.16 |
| Contracts | Service |

**Implementation Notes**
- Integration: 実績累積と予定時間差分で残り時間算出。ゲージ表示用の標準化データを返す。
- Risks: タイムゾーン差異→データは UTC, 表示のみローカル。

#### Burndown
| Field | Detail |
|-------|--------|
| Intent | バーンダウンと週次サマリ算出 |
| Requirements | 4.1,4.4,4.13 |
| Contracts | Service |

**Implementation Notes**
- Integration: スプリント開始日時を基点に日次残工数（件/見積時間）をプロットする。残工数は原則「`status != Done` のタスクの見積時間合計」とし、Done へ移動した時に減る。WontFix は別集計（線を分ける/注記する）として扱う。
- 更新タイミング: `moveTask`（Done ⇄ 非 Done）、`updateTask`（見積時間変更）、`applyRemote` のマージ適用後に更新する。Dashboard を表示していない間はリアルタイム描画を不要とし、Dashboard 表示時にスナップショット欠損分のみ再計算して整合を取る。
- Risks: 途中教科削除不可ルール反映を忘れない。

#### Availability
| Field | Detail |
|-------|--------|
| Intent | 学習可能時間（曜日デフォルト＋当日上書き＋予定表示を参考にした手動調整） |
| Requirements | 4.9-4.12 |
| Contracts | Service |

**Implementation Notes**
- Integration: `dayDefaultAvailability` を初期値とし、スプリント内の日付が `Sprint.dayOverrides` に存在する場合はその値で上書き。Calendar 予定は表示のみで、学習可能時間の計算には自動反映しない（ユーザー手動入力を優先）。
- Risks: 予定表示の終日/タイムゾーン処理（表示上の問題のみ）。
- viewMode=readonly の場合、学習可能時間の上書きは受け付けず、読み取りのみとする。

#### PomodoroTimer
| Field | Detail |
|-------|--------|
| Intent | 作業/休憩計測と通知（タスク実績とは独立） |
| Requirements | 3.12-3.14 |
| Contracts | Service |

**Implementation Notes**
- Integration: AlertToast に開始/終了/休憩状態を通知し、InProAutoTracker と連携せずに独立稼働する（PT の休憩は実績を変えない）。
- Risks: ブラウザスリープ時の精度低下→Service Worker アラームは使用せず、再開時に経過補正。

#### InProAutoTracker
| Field | Detail |
|-------|--------|
| Intent | InPro ステータスのタスクに対して、滞在中の経過時間を自動で実績に加算する | 3.12 |
| Contracts | Service |

**Implementation Notes**
- InPro 入室時に計測開始し、1 分刻みで Task.actuals に追記。バックグラウンド復帰時は経過差分を算出して一括加算し、計測ずれを補正。
- InPro 退出（他ステータスへ移動、または別タスクが InPro へ入る）時に計測を停止し、最終加算を行う。タブ終了時は Beacon/Fallback で最終書き込みを試行。
- PomodoroTimer とは独立（Pomodoro は通知と休憩管理のみ）。Pomodoro が停止中でも計測は継続し、休憩は実績に影響させない。
- オフラインでも加算を続け、pendingQueue に ChangeRecord を enqueue。同期後に Drive/Calendar 反映。
- viewMode=readonly の場合は計測を開始せず、既存の実績を書き換えない。

#### BackupService
| Field | Detail |
|-------|--------|
| Intent | バックアップの取得・保持ローテーション・復元を行う | 5.13 |
| Contracts | Service |

**Implementation Notes**
- トリガー: 日次と週次で snapshot を作成（自動スケジュールは常時有効で、アプリ稼働中かつオンラインなら SyncEngine が実行）。必要に応じて UI から手動実行も可能にする。
- 保持ポリシー: retention スロットを日次/週次で管理（例: daily=7 件, weekly=4 件）。新規作成時にスロット上限を超えた古い snapshot を削除/上書き。
- スコープ: daily は「現行スプリント + settings + queue（+calendarEvents 必要なら）」のみを保存。weekly は「全スプリント + settings + queue」を保存。新規スプリント確定直後の最初の daily/weekly で必ず当該スプリントを含める。temp/manual はデフォルト daily 同等スコープだが、オプションで全スプリントを含められる。
- 格納形式（zip 分割）: Drive の `/LPK/backups/` に以下を保存する。  
  - `common-{type}-{isoDate}.zip`: settings.json, queue.json, calendarEvents.json（必要なら）, manifest.json（全体ハッシュ/ファイルリスト/必要な月一覧/世代ID/type）を同梱。type ごとに retention（daily=7, weekly=4 など）で世代を保持し、上限超過時に古い順から削除。  
  - `sprints-{type}-{YYYY-MM}-{isoDate}.zip`: 当該月に開始した週次スプリントの sprint-{id}.json をまとめた zip。type（daily/weekly/temp/manual）ごとに月単位で世代管理し、各 type×月で retention 上限（daily=7, weekly=4 など）を超えた古い世代は削除。現在の月はバックアップ時に毎回新規生成、過去月は世代保持のみで内容は不変（週次が必ず1週単位なので月跨ぎは開始月に所属させる）。  
  - `{type}` は daily/weekly/temp（必要に応じて manual 追加）。weekly は最新 common に加え、必要な月の `sprints-{type}-{YYYY-MM}-{isoDate}.zip` を取得。daily は現行スプリントが属する月の `sprints-{type}-{YYYY-MM}-{isoDate}.zip` のみ更新/取得する。
- 復元フロー: UI で一覧→選択→復元確認→ pendingQueue を一時停止。`common-*.zip` をダウンロードして manifest を検証し、manifest が指す月の `sprints-{type}-{YYYY-MM}-{isoDate}.zip` を順次ダウンロードして展開。StorageAdapter 経由で settings/queue/sprint-* をトランザクション適用→ pendingQueue 再開→ SyncEngine が Drive/Calendar と再同期。Drive/Calendar との差分は SyncEngine のマージルールで再同期。
- 復元時の安全策: 現行状態を一時的にローカルへバックアップ（temp slot）し、失敗時はロールバック可能にする。
- UI 起点: SettingsPanel からバックアップ一覧取得・手動バックアップ・復元を実行する。
- 手動バックアップ/復元のエラーハンドリング: オフライン時は実行せずエラーを表示（キューに積まないが自動バックアップスケジュールは継続）。Drive 権限不足時はエラーを表示し再認証を促し、ユーザーが許可した場合のみ認証フローを実施して再試行する。
- viewMode=readonly の場合、手動バックアップ/復元操作は無効化（表示のみ）とする。
- viewMode=readonly の場合、SyncEngine はローカルキューを持たず（enqueue しない）、設定された間隔（デフォルト 1 分）で Drive/Calendar から pull して表示を更新する。オフライン時は最終スナップショットを表示し、オンライン復帰時に即時 pull する。

#### SyncEngine
| Field | Detail |
|-------|--------|
| Intent | ローカル変更キュー管理と Drive/Calendar 双方向同期 |
| Requirements | 5.3-5.6,6.3,5.10 |
| Contracts | Service |

**Dependencies**
- Outbound: DriveAdapter (P0); CalendarAdapter (P0); StorageAdapter (P0); TaskStore (P0)

**Contracts**: Service [x]
```typescript
// ローカル変更キューの管理と Drive/Calendar との同期を司る
interface SyncEngine {
  enqueue(change: ChangeRecord): void; // 変更をキューに積む
  flush(): Promise<SyncResult>; // キューを送信し同期を実行
  applyRemote(remote: RemoteSnapshot): Promise<MergeResult>; // リモート差分をローカルへマージ（Web Worker を含むため非同期）
}
```
- Preconditions: オフライン時は flush をスキップしキューのみ蓄積。
- Postconditions: 成功時に lastSyncedAt/世代 ID を更新。失敗時は再試行可能なステータスを返却。

**Implementation Notes**
- Integration: syncToken 失効時のフルリロード、競合時はローカル優先で警告。更新競合は世代ID＋更新時刻で解決し、セル内順序（priority）はタスク単位でマージしつつ、同一セル内で同値（重複）やギャップ不足がある場合は PrioritySorter で正規化する。キューはサイズ上限でバッチ分割。BackupService を介して日次/週次スナップショットを取得し、復元時は pendingQueue を停止したうえで適用→再同期する。
- Drive のマージ/差分計算（remote→local）は Web Worker に委譲し、Worker は「適用可能な patch（tasks/subjectsOrder/burndownHistory などの差分）」を返す。SyncEngine は戻り値を TaskStore に適用し、IndexedDB commit と pendingQueue 更新を行う。
- ステート取得時に Drive から古いリビジョンへ後退しないよう、DriveAdapter の head revision/etag を確認し、世代ID が後退する場合は拒否して再取得する（最新の1版のみを同期対象とし、旧版は BackupService 管理下のスナップショットとして扱う）。
- Risks: 大きな差分でのパフォーマンス低下→バッチ分割。
- viewMode=readonly の場合、キューを保持せず enqueue/flush は行わない。Drive/Calendar への書き込みを行わず、設定された間隔（デフォルト 1 分）で pull のみ実行して表示を更新する。

#### DriveAdapter / CalendarAdapter
| Field | Detail |
|-------|--------|
| Intent | 各 API の呼び出しとトークン管理 | 
| Requirements | 4.6-4.7,5.3,5.10 |
| Contracts | API |

**Implementation Notes**
- Drive: JSON ファイルを専用ディレクトリに保存（tasks.json 等）、`If-Match` を用いた楽観ロックを検討。`files.get` で head revision/etag を取得し、ローカルより古いリビジョンをダウンロードしない防御を入れる。バックアップは `/LPK/backups/` 配下に分離し、通常同期ファイルとは混在させない。バックアップ格納は zip 前提（`common-{type}-{isoDate}.zip` と `sprints-{type}-{YYYY-MM}-{isoDate}.zip`）で、アップロード/ダウンロードはファイル単位のフル転送。部分取得は不可のためクライアントで unzip して使用する。
  - Drive 同期用 JSON には `schemaVersion` を必須フィールドとして含める（例: `{ schemaVersion: 3, updatedAt: ISODateTime, data: {...} }`）。アプリ再インストールや更新で仕様差分がある場合でも、読み込み時に `schemaVersion` を検証して段階的にマイグレーションする。
  - マイグレーション: `schemaVersion < currentSchemaVersion` の場合、`vN → vN+1` の migrator を順に適用し、ローカル（IndexedDB）へ commit 後に Drive 側も最新 `schemaVersion` で上書きする（書き戻し前に Drive の Revisions（またはバックアップ）で 1 世代確保）。未知の `schemaVersion` またはマイグレーション失敗時は同期を停止し、リビジョン選択またはバックアップ復元を促す。
- Calendar: syncToken で差分取得、ETag と updated を比較して競合を検出し、競合時は Google を優先（LPK 側の同一イベント変更は破棄して Google の内容を採用）。同期対象フィールドは `summary`, `description`, `start`, `end`, `status`, `source` に限定し、それ以外は読み取り専用または非対象。削除は tombstone として伝播し、LPK 起点の削除も Google 起点の削除も双方へ反映する。recurrence は同期対象外で読み取りのみ（繰り返し予定は表示専用）。失効時は full sync。
- Risks: レートリミット→指数バックオフと MSW でテスト。

#### StorageAdapter (IndexedDB)
| Field | Detail |
|-------|--------|
| Intent | ローカル永続（状態＋キュー） |
| Requirements | 5.4,5.5 |
| Contracts | Service |

**Implementation Notes**
- バージョン管理しマイグレーションで互換維持。トランザクションはタスク＋キューを同一バッチで保存。
- IndexedDB のスキーマバージョンと Drive の `schemaVersion` は別管理とする。起動時は「(1) IndexedDB マイグレーション → (2) Drive から取得した JSON の `schemaVersion` マイグレーション → (3) TaskStoreState へ集約」の順で整合を取る。

#### UpdateManager / ServiceWorker
| Field | Detail |
|-------|--------|
| Intent | バージョン検知と強制アップデート、オフラインキャッシュ |
| Requirements | 4.1,5.8,5.9,5.14 |
| Contracts | Service |

**Implementation Notes**
- 新バージョン検知: `version.json`（ビルド時に埋め込んだ appVersion）を fetch してローカル版と比較し、新版なら Service Worker `registration.update()` を実行。`updatefound/statechange` で完了を監視し、強制更新時は `skipWaiting` → クライアントに `postMessage` でリロード要求。未同期変更がある場合は同期完了までリロード遅延。
- 強制更新時の優先順位: 未同期の `pendingQueue` が空になるまで `skipWaiting` しない。キューがあれば即座に `flush` を試行し、成功後に `skipWaiting`。失敗/オフライン時は pendingQueue をローカルに temp バックアップして更新を保留し、オンライン復帰後の flush 成功で `skipWaiting` を実行。ユーザーが明示的に「バックアップして強制リロード」を選んだ場合のみ同期前リロードを許可する。
- 手動チェック: SettingsPanel からの「更新を確認」が UpdateManager.checkForUpdate を呼び出し、上記と同じ検知→更新フローをトリガーする。自動チェックとの衝突を避けるため、実行中は重複チェックを抑止する。

### Infra/Tooling
- Auth: Google OAuth（トークンはメモリまたは Session Storage、長期保存しない）。閲覧専用は Google Drive の LPK フォルダ共有リンク（閲覧者）で提供し、AppShell/Router が対象 `dataFolderId` の読み取り可否で viewMode を判定する。共有解除で Drive API が 403/404 を返した場合は失効とみなす。
- DevContainer/CI: VS Code Dev Container 上で実装・ビルド・テストを一貫実行し、CI は test→build→deploy to Pages を自動化。
- RepoSetupScript: gh API を用いて main 保護（必須チェック/レビュー）、マージ方式（Squash/通常マージ許可, Rebase 無効）、ブランチ自動削除、必要に応じて Pages 設定を適用する。入力: リポジトリ owner/repo; 出力: 設定結果（ログ）。

## Data Models

### Domain Model
- **Task**: id, title, detail, subjectId, status, priority（ギャップ付き rank。数値が大きいほど上＝高優先度）, estimateMinutes, actuals[{date, minutes}], dueDate, createdAt, updatedAt.
- **Subject**: id, name.
- **Sprint**: id (スプリント開始日の ISO 日付を推奨), startDate (Mon), endDate, subjectsOrder (SubjectId[]), dayOverrides[{date, availableMinutes}]（スプリント内の特定日上書き）, burndownHistory: BurndownHistoryEntry[]
- **CalendarEvent**: id, title, description, start/end, status, source (LPK/Google), etag.
  - カレンダー全体の `syncToken` はカレンダーメタとして管理し、イベントごとには持たせない。
- **Settings**: statusLabels, language (ja/en), dayDefaultAvailability, notifications, currentSprintId, readonlyRefreshIntervalSec (閲覧専用時の定期 pull 間隔・秒、デフォルト 60).
- **SyncState**: lastSyncedAt, generation, pendingQueue.
- **BackupSnapshot**: id, createdAt, manifestVersion, files[{name, path, checksum, kind (common|sprints), month (YYYY-MM)?}], retentionSlot (daily/weekly), type (daily/weekly/temp/manual), isoDate, source (local/remote).
- **BurndownHistoryEntry**: date, remainingMinutes, remainingCount（過去日付のバーンダウン表示用スナップショット）

### Logical Data Model
- IndexedDB ストア: `tasks`, `subjects`, `sprints`, `settings`, `syncState`, `calendarEvents`, `pendingQueue`。アプリ起動時にこれらを集約して TaskStoreState に載せる（TaskStoreState とファイルは1対1ではない）。
- Key: `Task.id` は uuid。`Task` の status は固定 enum。`pendingQueue` は順序付きログ。
- Consistency: Task と pendingQueue は同一トランザクションで更新。教科削除時はタスク存在チェックで禁止。セル内順序は Task.priority で保持する（上が高優先度、下が低優先度）。
- BurndownHistory: 過去日付の残工数（件/見積時間）はスプリントファイル内の `burndownHistory` に日次スナップショットとして保持し、過去表示はスナップショットを優先する（欠損時のみ再計算）。
- updatedAt 運用: ローカル編集時にレコードの updatedAt を現在時刻で更新。並び替え（優先度変更）で複数 Task の priority が変わった場合は、同一操作で更新された Task の updatedAt を揃える。applyRemote で採用したリモートレコードはリモートの updatedAt を保持。ファイル書き出し時にファイル単位の updatedAt も更新する。
- スプリントファイル作成タイミング: カレンダーで未来週を参照しただけでは作成しない。ユーザーが明示的に「スプリントを表示」を確定した時点で `sprint-{sprintId}.json` を新規作成（存在しない場合）。過去スプリントのファイルは削除せず保持し、settings.currentSprintId を更新する。
- スプリント未開始週の編集: スプリントが未開始の週はカレンダー/Availability を閲覧のみとし、学習可能時間の上書きやスプリントデータの編集は「スプリントを表示」確定後にのみ許可する。
- バックアップ保存先（Drive 側）: `/LPK/backups/` 配下に `common-{type}-{isoDate}.zip`（settings/queue/calendarEvents/manifest）と `sprints-{type}-{YYYY-MM}-{isoDate}.zip`（開始月ごとのスプリント群）を保存する。バックアップは IndexedDB には格納しない（必要時に Drive からダウンロードして復元）。

- ### Data Contracts & Integration
- **Drive**: `/LPK/` 配下にスプリント単位の `sprint-{sprintId}.json`（tasks, subjectsOrder, dayOverrides, burndownHistory）と `settings.json`（statusLabels, language, currentSprintId 等）、`queue.json`（変更キュー）を保存する。各ファイルは `schemaVersion` と `updatedAt` を持つエンベロープ形式（`{ schemaVersion, updatedAt, data }`）とし、読み込み時に `schemaVersion` を検証してマイグレーションする。ファイル自体はそれぞれ1つを維持し、Drive の Revisions をバックアップとして活用する。リビジョン保持数をローテーション管理し、必要な世代のみ `keepForever`、古いものは削除。復元はリビジョンを取得しローカルへ戻す。settings.json は updatedAt で丸ごと上書き、スプリントファイルはタスク単位で updatedAt マージ＋priority をマージし、同一セル内で同値（重複）やギャップ不足が発生した場合は PrioritySorter で正規化する。
- **Calendar**: 予定は Google Calendar から常に取得し、IndexedDB の `calendarEvents` にキャッシュして表示する。Google Drive の通常同期データには保存しない（バックアップに含める場合のみ `calendarEvents.json` として保存）。学習可能時間の算出には自動反映せず、表示のみとする。LPK 起点イベントは source=LPK を付与し二重反映を防止し、競合時は Google を優先する。
- **Internal Events**: `SyncStatusChanged`, `UpdateAvailable`, `PomodoroTick` を発行し UI 通知と再計算をトリガ。

## Error Handling

### Error Strategy
- 早期バリデーション（フォーム入力、ポリシー判定）でユーザーエラーを即時返却。
- 同期/API 失敗は非モーダルで通知し、再試行ボタンを提供。リトライは指数バックオフ。
- PWA 更新は通知後に自動リロード。保存されていない変更がある場合は同期完了まで遅延。

### Error Categories and Responses
- User Errors: フィールド未入力/形式不正 → フィールドエラー表示; ポリシー違反（Today→InPro など）→ Toast で理由表示。
- System Errors: Drive/Calendar API 失敗 → 再試行可能通知; IndexedDB 失敗 → 再読み込みを促し、データ保護のため同期を停止。
- Business Logic Errors: Done 遷移禁止条件、InPro 複数禁止 → ポリシー拒否を返し UI で提示。

### Monitoring
- Service Worker/同期エラーをコンソールと UI に surfaced。将来の遠隔ロギングはインターフェースを残すが実装は後続。

## Testing Strategy
- Unit: StatusPolicy（遷移ガード、副作用）、TimeCalc（残り時間/負荷/期日）、Availability（予定控除と上書き）、Burndown 計算、SyncEngine キュー処理。
- Integration: KanbanBoard+Dnd キーボード/マウス、TaskDialog フォーカストラップ、SyncEngine と StorageAdapter の永続、CalendarAdapter の syncToken リカバリ。
- E2E (Playwright): タスク作成→InPro への移動ガード、Today 過負荷警告、オフライン操作→再接続同期、閲覧専用モード表示。
- Performance: 200 タスク・10 教科での DnD/スクロール応答、同期時のバッチ処理時間。

## Security Considerations
- Google OAuth トークンは長期保存しない（メモリ/Session Storage）。Drive/Calendar scope を最小限に限定。
- 閲覧専用は Google Drive の共有権限で提供する。共有解除で Drive API が 403/404 を返した場合、失効ダイアログを表示し確認後に IndexedDB のデータを全削除する。
- Service Worker キャッシュには機密データを含めず、IndexedDB も同様に個人情報を最小化。

## Performance & Scalability
- Board 描画はバーチャライゼーションを前提に拡張可能な構造で実装する。縦スクロールの支配的コストを下げるため、教科行単位のバーチャライゼーションを優先し、必要に応じて行内の列リストを部分的に仮想化する。TimeCalc/Burndown はメモ化。
- 同期は差分キュー＋バッチ送信、Calendar 差分取得で通信量を抑制。
- 強制アップデート時の再ロード前に同期を完了させ、データ損失を防止。

## Supporting References
- 詳細な API 呼び出し仕様や競合解決パターンは `research.md` の Design Decisions と Research Log を参照。
- 閲覧専用モードで管理: `viewMode`（editable|readonly）を Router/AppShell から受け取り、編集系操作（DnD/ダイアログ起動/保存）を無効化する。
- viewMode が readonly の場合は全入力を無効化し表示専用とする。
