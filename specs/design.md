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
- **Logic**: Drag & Drop (geometric insertion), Filtering, Persistence.

### `CalendarView.tsx`
- **Design**: Compact card, fixed width (~320px).
- **UI**: Circular date cells (`rounded-full`, `aspect-square`).
- **Features**: Heatmap coloring, Week selection (Monday start).

### `TaskCard.tsx`
- **Display**: Standard or Compact (for Done/Won't Do).
- **Interaction**: Drag start/end handlers.

### `TaskModal.tsx` & `SubjectManager.tsx`
- **Modals**: For creating/editing entities.
- **Validation**: Custom delete confirmations to bypass sandbox restrictions.

## 4. Key Algorithms
- **Drag & Drop**: Custom implementation using mouse Y-coordinates to determine insertion index.
- **Move Validation**: Checks against `ALLOWED_TRANSITIONS` and Top-Task rule.
- **Single Studying**: Auto-move existing `Studying` task to `Hold`.

## 5. UI Design System
- **Colors**: Slate (Neutral), Blue (Primary/Today), Green (Done/Heatmap), Purple (Studying), Red (Priority/Warning).
- **Shapes**: Rounded corners (XL for containers, LG for items), Circular badges/dates.
