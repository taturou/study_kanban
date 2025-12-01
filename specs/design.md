# StudyMatrix Kanban - Design Documentation

## 1. Technical Stack
- **Framework**: React 19 (Functional Components, Hooks)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite (Implied)
- **Storage**: Browser LocalStorage

## 2. Data Structures (`types.ts`)

### TaskStatus (Enum)
Defines the column order and logic keys.
`TOMORROW_PLUS`, `TODAY`, `STUDYING`, `HOLD`, `DONE`, `WONT_DO`

### Task (Interface)
```typescript
interface Task {
  id: string;
  subjectId: string;
  status: TaskStatus;
  title: string;
  description?: string;
  estimatedMinutes: number;
  actualMinutes: number;
  deadline?: number;
  createdAt: number;
  order: number; // Float/Integer used for sorting. Lower value = Higher priority.
}
```

### Subject (Interface)
```typescript
interface Subject {
  id: string;
  name: string;
  color: string;
}
```

## 3. Component Architecture

### `App.tsx` (Container)
- **State**:
  - `tasks`: Array of all tasks.
  - `subjects`: Array of subjects.
  - `reminders`: Array of reminders.
  - `dragState`: Information about the task currently being dragged (`sourceSubjectId`, `isSourceTop`, etc.).
  - `dropTarget`: The calculated destination (`subjectId`, `status`, `index`) used for the placeholder.
- **Responsibilities**:
  - Layout rendering:
    - Uses **Independent CSS Grids** for each Subject Row to allow independent height adjustment.
    - Maintains column alignment via shared `grid-template-columns`.
  - Data persistence (`useEffect` -> `localStorage`).
  - **Drag & Drop Logic**: Centralized handler for `onDragStart`, `onDragOver` (Container), and `onDrop`.
  - **Rule Enforcement**: Implementation of transition rules and "Single Studying" logic.

### `TaskCard.tsx`
- **Props**: `task`, `index`, `isDragging`.
- **Responsibilities**:
  - Rendering task details.
  - **Conditional Rendering**:
    - **Default**: Full card with details (Title, Status Icon, Estimates, Deadline).
    - **Compact**: Used for `DONE` and `WONT_DO` statuses. Displays a single line with Icon, Title (strikethrough for Done), and Actual Time.
  - Handling `dragStart` events.
  - **Visuals**: Hides itself (`display: none` / `hidden` class) when `isDragging` is true, relying on the `App` component to render the **Placeholder**.

### `TaskModal.tsx`
- **Responsibilities**: Form for creating/editing tasks. Hides internal fields (Priority selector, Status selector) to simplify UX.
- **Handlers**:
  - `handleDeleteClick`: Explicitly stops event propagation and triggers a custom confirmation view state (`isDeleteConfirmOpen`).
  - **Custom Confirmation UI**: A sub-modal component rendered conditionally when `isDeleteConfirmOpen` is true. This replaces `window.confirm` to avoid sandbox restrictions.

## 4. Key Algorithms

### 4.1 Drag & Drop (Geometric Insertion)
Instead of standard list sorting libraries, a custom geometric approach is used for precision:
1. **Drag Start**: Capture `taskId` and whether it is at index 0 (`isSourceTop`).
2. **Drag Over (Cell)**:
   - Validate if the move is allowed using `canMoveTask`.
   - Iterate through visible children of the cell container.
   - Compare Mouse Y coordinate with the vertical midpoint of each child.
   - Determine exact insertion `index`.
3. **Render**: The `App` component renders a "Placeholder" `div` at the calculated `dropTarget` index. The original task is hidden.
4. **Drop**:
   - Update `tasks` state.
   - Re-calculate `order` for all tasks in the destination list to ensure clean integer sequencing.

### 4.2 Move Validation (`canMoveTask`)
A centralized function in `types.ts` checks:
1. **Same Subject**: Checks `ALLOWED_TRANSITIONS` map.
2. **Cross Subject**: Only returns true if status is `TOMORROW_PLUS` or `TODAY` and the target status matches the source status.

### 4.3 Single "Studying" Enforcement
Implemented in `handleSaveTask` and `handleDrop`:
- IF target status is `STUDYING`:
  - Find any *other* task with status `STUDYING`.
  - Change that task's status to `HOLD`.
  - Proceed with the save/move.

## 5. UI Design System
- **Color Palette**:
  - Statuses have semantic colors (e.g., Today=Blue, Studying=Purple, Done=Green, Won't Do=Red).
  - Neutral Slate grays for structure and text.
- **Interactions**:
  - Hover effects on cards.
  - Modern "Ghost" drag images (handled by browser, triggered via `setTimeout` delay in React).
  - Modals with backdrop blur/darkening.