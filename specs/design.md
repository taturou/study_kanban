# StudyMatrix Kanban - Design Documentation

## 1. Technical Stack
- **Framework**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## 2. Data Structures
See `types.ts` for full definitions of `Task`, `Subject`, `WorkLog`, etc.

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
- **Sticky Positioning**:
  - Status Headers (Top): `sticky top-0`.
  - Subject Headers (Left): `sticky left-0`.
  - **Important**: The grid row container (`div.grid`) must **NOT** have `overflow-hidden` for the left sticky header to work relative to the main viewport scroll.

### `CalendarView.tsx`
- **Design**: Compact card, fixed width (~320px).
- **UI**: Circular date cells (`rounded-full`, `aspect-square`).
- **Features**: Heatmap coloring, Week selection (Monday start).

### `TaskCard.tsx`
- **Display**: Standard or Compact (for Done/Won't Do).
- **Icons**: Uses Flag for Deadline, CalendarCheck for Last Execution.
- **Interaction**: Drag start/end handlers.

### `TaskModal.tsx` & `SubjectManager.tsx`
- **Modals**: For creating/editing entities.
- **Validation**: Custom delete confirmations to bypass sandbox restrictions.
- **Study Log Manager**: `TaskModal` manages `workLogs` (array of date/minutes). Total `actualMinutes` is derived from this log array.

## 4. Key Algorithms
- **Drag & Drop**: Custom implementation using mouse Y-coordinates to determine insertion index.
- **Move Validation**: Checks against `ALLOWED_TRANSITIONS` and Top-Task rule.
- **Single Studying**: Auto-move existing `Studying` task to `Hold`.
- **Board Panning**: Implemented via mouse events (`mousedown`, `mousemove`) on the main scrollable container to adjust `scrollLeft` and `scrollTop` based on cursor movement delta. Ignores interactions with tasks/buttons.

## 5. UI Design System
- **Colors**: Slate (Neutral), Blue (Primary/Today), Green (Done/Heatmap), Purple (Studying), Red (Priority/Warning).
- **Shapes**: Rounded corners (XL for containers, LG for items), Circular badges/dates.