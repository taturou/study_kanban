# StudyMatrix Kanban - Requirements

## 1. Product Overview
**StudyMatrix Kanban** is a Single Page Application (SPA) designed to help users plan and execute their study schedules effectively. It utilizes a 2-dimensional Kanban board to organize tasks by **Subject** (rows) and **Status** (columns).

## 2. Core UI Structure
- **Layout**: 2D Matrix (Rows: Subjects, Columns: Statuses).
- **Target Devices**: PC and Tablet (Responsive design).
- **Subject Rows**: Users can add, edit, and delete subjects (e.g., Math, English).
- **Status Columns** (Fixed Order):
  1. **Tomorrow+** (明日以降): Backlog for future tasks.
  2. **Today** (今日やる): Queue for today's tasks.
  3. **Studying** (勉強中): The single active task being worked on.
  4. **Hold** (保留): Paused tasks.
  5. **Done** (終わった): Completed tasks.
  6. **Won't Do** (やらない): Cancelled tasks.

## 3. Task Management
### 3.1 Task Properties
Users can view and edit strictly the following fields:
- **Title**: Name of the task.
- **Deadline**: Date (optional).
- **Estimated Time**: Planned duration in minutes.
- **Actual Time**: Actual duration spent in minutes.
- **Memo**: Description or notes.

*Note: Internal properties like `id`, `subjectId`, `status`, `priority`, and `order` are managed by the system.*

### 3.2 Task Transitions Rules (State Machine)
Tasks must follow strict transition rules based on their current status.

#### Status Transitions (Same Subject)
- **From Tomorrow+**: → Today, Won't Do
- **From Today**: → Tomorrow+, Studying, Won't Do
- **From Studying**: → Today (Return to queue), Hold, Done, Won't Do
- **From Hold**: → Studying, Done, Won't Do
- **From Done**: → Today (Re-open)
- **From Won't Do**: → Today (Revive)

#### Cross-Subject Movement
- **Allowed**: Tasks can move between subjects ONLY if they are in **Tomorrow+** or **Today** status.
- **Forbidden**: Tasks in Studying, Hold, Done, or Won't Do cannot change subjects.
- **Constraint**: When moving between subjects, the status must remain the same.

### 3.3 Priority & Movement Constraints (The "Top Task" Rule)
- **Ordering**: Tasks are ordered within a cell. Higher position = Higher priority.
- **Movement Restriction**: Only the task at the **very top (Index 0)** of a list can be moved to a different Status or Subject.
- **Reordering**: Users can freely reorder tasks within the same cell to change priority.

### 3.4 Global "Studying" Constraint
- **Single Active Task**: Only **one** task can be in the "Studying" status across the entire application (all subjects).
- **Auto-Hold**: Moving a new task to "Studying" automatically moves the existing "Studying" task to "Hold".

## 4. Interaction (Drag & Drop)
- **Visual Feedback**:
  - **Placeholder**: A dashed outline indicates where the task will be dropped.
  - **Avoidance**: Other tasks visually shift to make room for the placeholder.
  - **Invalid Targets**: If a user drags a non-top task (or attempts an invalid transition), invalid destination cells are visually grayed out/blocked.
- **Drop Logic**:
  - Dropping on a cell: Appends to the end of the list.
  - Dropping on a task: Inserts the task immediately before the target task.

## 5. Analytics & Features
- **Analytics Dashboard**:
  - Visualize total study time.
  - Task completion rates per subject (Bar/Pie charts).
  - Average time per task.
- **Reminders**:
  - Users can set custom browser notifications (Time, Days of week, Message).
  - Requires browser permission.
- **Persistence**: All data (Tasks, Subjects, Reminders) is saved locally (LocalStorage).
