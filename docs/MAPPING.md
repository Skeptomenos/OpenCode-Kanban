# Kanban Mapping Logic

> **Goal:** Explain how raw data (Sessions/Projects) is transformed into Visual Elements (Columns/Cards) and how to change it.

## 1. The Core Concept
The Kanban board is a "View" over your data. The data itself (Sessions) does not have a "column" field. We calculate it on the fly.

**Flow:**
`API (/api/sessions)` → `Raw JSON` → `KanbanBoard (useEffect)` → `Mapping Logic` → `UI State`

## 2. Current Implementation (v1)
**File:** `src/features/kanban/components/kanban-board.tsx`

Currently, we group sessions by **Project**.

| UI Element | Data Source | Logic |
| :--- | :--- | :--- |
| **Columns** | `data.projects` | 1 Project = 1 Column. ID = `project.id` |
| **Cards** | `data.sessions` | All sessions. Column = `session.projectID` |

**Code Snippet:**
```typescript
// Columns = Projects
const newCols = data.projects.map(p => ({
  id: p.id,
  title: p.worktree.split('/').pop()
}));

// Tasks = Sessions
const newTasks = data.sessions.map(s => ({
  id: s.id,
  status: s.projectID // Matches Column ID
}));
```

## 3. How to Change It

You can completely reshape the board by changing **only** the `useEffect` block in `kanban-board.tsx`.

### Strategy A: "Time-Based" (Triage)
*Goal: See what I worked on recently vs long ago.*

1.  **Columns:** Hardcoded (`['Today', 'Yesterday', 'Older']`).
2.  **Mapping:**
    ```typescript
    status: isToday(s.updatedAt) ? 'Today' : 'Older'
    ```

### Strategy B: "Workflow" (Todo / Doing / Done)
*Goal: Manage active sessions.*

1.  **Columns:** Hardcoded (`['Active', 'Saved', 'Archive']`).
2.  **Mapping:** You need a way to store this status.
    *   *Option 1 (Derived):* If `updatedAt` < 1 hour = "Active".
    *   *Option 2 (Persisted):* We need to write to a local JSON file to save the state.

### Strategy C: "Project Filter" (Single Project View)
*Goal: Focus on one repo.*

1.  **Filter:** `data.sessions.filter(s => s.projectID === currentProjectID)`
2.  **Columns:** Use Strategy A or B *inside* that project.

## 4. Where to Edit
Go to `src/features/kanban/components/kanban-board.tsx`.
Look for `useEffect` -> `fetch`.
The mapping logic is right there in the `.then()` block.
