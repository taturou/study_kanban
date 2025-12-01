# StudyMatrix Kanban - Requirements

## 1. Product Overview
**StudyMatrix Kanban** is a Single Page Application (SPA) designed to help users plan and execute their study schedules effectively. It utilizes a 2-dimensional Kanban board to organize tasks by **Subject** (rows) and **Status** (columns).

## 2. Core UI Structure
- **Layout**: 2D Matrix (Rows: Subjects, Columns: Statuses).
- **Independent Row Heights**: Each Subject row's height adjusts independently based on the number of tasks it contains.
- **Top Layout**: The top area (below header) contains the **Calendar View** aligned to the **left**, with **empty space reserved on the right**.
- **Target Devices**: PC and Tablet (Responsive design).
- **Subject Rows**: 
  - Subjects can be managed per **Week**.
  - Users can create new subjects or add existing ones (from history) to the current week.
  - Removing a subject from the current week hides it for that week but preserves it in history.
- **Status Columns** (Fixed Order):
  1. **Tomorrow+** (明日以降)
  2. **Today** (今日やる)
  3. **Studying** (勉強中)
  4. **Hold** (保留)
  5. **Done** (終わった)
  6. **Won't Do** (やらない)
- **Task Visualization**:
  - **Standard View**: Detailed card showing Title, Deadline (Flag Icon), Last Execution Date (Check Icon), Estimates.
  - **Compact View**: Minimalist single-line display for **Done** and **Won't Do** tasks.

## 3. Calendar & Weekly Planning
- **UI Design**: Modern, compact card layout displayed at the top-left.
- **Date Display**: Dates are displayed as **circles** (rounded-full).
- **Heatmap**: Each day is colored based on total study time, using **Navy Blue** shades (Light Blue to Deep Navy).
- **Week Selection**: A small **gray indicator bar** is displayed below each date of the selected week.
- **Today Highlight**: The current date is highlighted with an **orange ring**.
- **Kanban Filter**: The board displays tasks only for the selected week.
- **Subject Filter**: The board displays subjects only active for the selected week.

## 4. Task Management
### 4.1 Task Properties
- **Visible**: Title, Deadline, Estimated Time, Actual Time, Memo.
- **Study Logs**: Users can register specific dates and times when they studied (Execution Date).
- **Icons**: Distinct icons for Deadline (Flag 🏁) and Execution Date (Check/Calendar ✅) to avoid confusion.
- **Internal**: ID, SubjectId, Status, Priority, Order, WorkLogs, StartDate.

### 4.2 Transition Rules
- **Same Subject**: Strict state machine (see `types.ts`).
- **Cross Subject**: Only allowed for `Tomorrow+` and `Today` tasks.

### 4.3 Priority & Constraints
- **Ordering**: D&D reordering within cells.
- **Movement Restriction**: Only the **Top Task** (Index 0) can change status/subject.
- **Single Studying**: Only one task can be `Studying` globally.

### 4.4 Deletion
- **Constraint**: Only tasks in `Tomorrow+` can be deleted.
- **Confirmation**: Custom in-app confirmation UI.

## 5. Subject Management
- **Scope**: Managed per week.
- **Constraint**: Subjects cannot be removed from the current week if they contain tasks scheduled for that week.
- **Confirmation**: Custom in-app confirmation UI.

## 6. Interaction
- **Drag & Drop**: Placeholder visualization, avoidance animation, invalid drop blocking.
- **Panning**: Users can drag empty spaces in the Kanban board to scroll the view horizontally and vertically.

## 7. Analytics & Features
- **Dashboard**: Study time stats, charts.
- **Reminders**: Browser notifications.
- **Persistence**: LocalStorage.
