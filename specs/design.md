# StudyMatrix Kanban - Design Documentation

## 1. Technical Stack
- **Framework**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## 2. Data Structures
See `types.ts` for full definitions.

### Subject
```typescript
interface Subject {
  id: string;
  name: string;
  color: string;
  weekStartDates?: number[]; // Array of Monday timestamps. If undefined, treated as global.
}
```

## 3. Component Architecture

### `App.tsx` (Container)
- **Layout**:
  - Header (Top)
  - Top Section (Flex Row):
    - `CalendarView` (Left, Fixed Width)
    - Empty Space (Right, Flex-1)
  - Kanban Board (Bottom, Scrollable)
- **State**: `tasks`, `subjects`, `reminders`, `selectedWeekStart`.
- **Logic**: Drag & Drop (geometric insertion), Filtering, Persistence, Panning.
- **Filtering**: Tasks AND Subjects are now filtered by `selectedWeekStart`.
- **Sticky Positioning**:
  - Status Headers (Top): `sticky top-0`.
  - Subject Headers (Left): `sticky left-0`.
  - **Important**: The grid row container (`div.grid`) must **NOT** have `overflow-hidden` for the left sticky header to work relative to the main viewport scroll.

### `CalendarView.tsx`
- **Design**: Compact card, fixed width (~320px).
- **UI**: 
  - Circular date cells (`rounded-full`).
  - **Heatmap Colors (Navy Blue Base)**: 
    - Level 0 (0m): Default/Empty
    - Level 1 (<30m): `#dbeafe` (Light Blue)
    - Level 2 (<60m): `#60a5fa` (Medium Blue)
    - Level 3 (<120m): `#1e40af` (Dark Blue)
    - Level 4 (>120m): `#172554` (Deep Navy)
  - **Selection**: Gray indicator bar (`bg-slate-400`) below dates.
  - **Today**: Orange ring (`ring-orange-400`).
- **Features**: Week selection (Monday start).

### `TaskCard.tsx`
- **Display**: Standard or Compact (for Done/Won't Do).
- **Icons**: Uses Flag for Deadline, CalendarCheck for Last Execution.
- **Interaction**: Drag start/end handlers.

### `TaskModal.tsx` & `SubjectManager.tsx`
- **Modals**: For creating/editing entities.
- **SubjectManager**:
  - **Inputs**: `selectedWeekStart` to manage weekly assignment.
  - **Logic**: 
    - Add: Create new OR link existing subject to current week.
    - Remove: Unlink subject from current week.
- **Validation**: Custom delete confirmations to bypass sandbox restrictions.
- **Study Log Manager**: `TaskModal` manages `workLogs` (array of date/minutes). Total `actualMinutes` is derived from this log array.

## 4. Key Algorithms
- **Drag & Drop**: Custom implementation using mouse Y-coordinates to determine insertion index.
- **Move Validation**: Checks against `ALLOWED_TRANSITIONS` and Top-Task rule.
- **Single Studying**: Auto-move existing `Studying` task to `Hold`.
- **Board Panning**: Implemented via mouse events (`mousedown`, `mousemove`) on the main scrollable container to adjust `scrollLeft` and `scrollTop` based on cursor movement delta. Ignores interactions with tasks/buttons.

## 5. UI Design System
- **Colors**: Slate (Neutral), Blue (Primary/Today), Navy Blue (Heatmap), Purple (Studying), Red (Priority/Warning), Orange (Today Highlight).
- **Shapes**: Rounded corners (XL for containers, LG for items), Circular badges/dates.
