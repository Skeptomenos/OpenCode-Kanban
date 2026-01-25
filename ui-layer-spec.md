# OpenCode Session Manager: UI Layer Specification

> **Document Type:** Product Requirements Document (PRD)  
> **Version:** 1.0  
> **Date:** 2026-01-24  
> **Related:** [session-research.md](./session-research.md)

---

## 1. Overview

### 1.1 Purpose

Build a visual UI layer to display, browse, and manage OpenCode sessions. The UI will show sessions grouped by project/repository, support filtering, and enable session resumption.

### 1.2 Goals

- Display all OpenCode sessions in a browsable interface
- Group sessions by project/repository
- Distinguish between root sessions and subagent sessions
- Enable quick session lookup and resumption
- Provide real-time updates when sessions change

### 1.3 Non-Goals (v1)

- Displaying message content or conversation history
- Editing session content
- Semantic search across sessions
- Token usage analytics or cost tracking
- File diff visualization

---

## 2. Data Requirements

### 2.1 Core Entities

#### Session

The primary entity. Each session represents one conversation with OpenCode.

| Field          | Type     | Required | Description                              |
| -------------- | -------- | -------- | ---------------------------------------- |
| `id`           | string   | Yes      | Unique identifier (e.g., `ses_xyz...`)   |
| `title`        | string   | Yes      | Display title (auto-generated or custom) |
| `slug`         | string   | Yes      | Human-readable slug (e.g., "playful-lagoon") |
| `projectID`    | string   | Yes      | Project hash or "global"                 |
| `directory`    | string   | Yes      | Working directory when created           |
| `parentID`     | string?  | No       | Parent session ID (for subagents)        |
| `time.created` | number   | Yes      | Unix timestamp (ms) of creation          |
| `time.updated` | number   | Yes      | Unix timestamp (ms) of last activity     |

#### Project

Groups sessions by repository/workspace.

| Field          | Type    | Required | Description                          |
| -------------- | ------- | -------- | ------------------------------------ |
| `id`           | string  | Yes      | SHA1 hash or "global"                |
| `worktree`     | string  | Yes      | Absolute path to project root        |
| `vcs`          | string  | No       | Version control system ("git")       |
| `icon.color`   | string  | No       | Visual color for project distinction |
| `time.created` | number  | Yes      | When project was first seen          |
| `time.updated` | number  | Yes      | Last activity in this project        |

### 2.2 Derived Data

The UI should compute these from raw data:

| Field            | Derivation                                     |
| ---------------- | ---------------------------------------------- |
| `projectName`    | Last path segment of `project.worktree`        |
| `isGlobal`       | `session.projectID === "global"`               |
| `isSubagent`     | `session.parentID !== null`                    |
| `relativeTime`   | Human-readable time from `time.updated`        |
| `sessionCount`   | Count of sessions per project                  |
| `messageCount`   | Count of messages in session (optional)        |

---

## 3. UI Data Model

### 3.1 TypeScript Interfaces

```typescript
/**
 * Session as represented in the UI
 */
interface UISession {
  // Identity
  id: string
  title: string
  slug: string
  
  // Project/Grouping
  projectId: string
  projectName: string        // Derived: last segment of worktree
  projectPath: string        // Full worktree path
  isGlobal: boolean          // Derived: projectId === "global"
  
  // Hierarchy
  parentId: string | null
  isSubagent: boolean        // Derived: parentId !== null
  childCount?: number        // Number of child sessions
  
  // Context
  directory: string          // Working directory
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  relativeTime: string       // "2 hours ago", "yesterday"
  
  // Visual
  iconColor?: string         // From project.icon.color
  
  // Optional enrichment (v2)
  messageCount?: number
  tokenCount?: number
  cost?: number
}

/**
 * Project as represented in the UI
 */
interface UIProject {
  id: string
  name: string               // Derived: last segment of worktree
  path: string               // Full worktree path
  isGlobal: boolean          // id === "global"
  
  // Aggregates
  sessionCount: number
  lastActive: Date
  
  // Visual
  iconColor?: string
}

/**
 * Application state
 */
interface UIState {
  // Data
  sessions: UISession[]
  projects: UIProject[]
  
  // Filters
  filters: {
    projectId: string | null    // null = all projects
    showSubagents: boolean      // true = include subagent sessions
    searchQuery: string         // title search
    timeRange: 'all' | 'today' | 'week' | 'month'
  }
  
  // UI State
  groupBy: 'project' | 'time' | 'none'
  sortBy: 'updated' | 'created' | 'title'
  sortOrder: 'asc' | 'desc'
  
  // Selection
  selectedSessionId: string | null
}
```

### 3.2 Data Transformations

```typescript
/**
 * Transform raw session data to UI model
 */
function toUISession(
  session: RawSession, 
  projectMap: Map<string, RawProject>
): UISession {
  const project = projectMap.get(session.projectID)
  const isGlobal = session.projectID === 'global'
  
  return {
    id: session.id,
    title: session.title,
    slug: session.slug,
    
    projectId: session.projectID,
    projectName: isGlobal ? 'Global' : getLastPathSegment(project?.worktree),
    projectPath: project?.worktree ?? '/',
    isGlobal,
    
    parentId: session.parentID ?? null,
    isSubagent: session.parentID != null,
    
    directory: session.directory,
    
    createdAt: new Date(session.time.created),
    updatedAt: new Date(session.time.updated),
    relativeTime: formatRelativeTime(session.time.updated),
    
    iconColor: project?.icon?.color
  }
}

/**
 * Transform raw project data to UI model
 */
function toUIProject(
  project: RawProject,
  sessionCounts: Map<string, number>
): UIProject {
  const isGlobal = project.id === 'global'
  
  return {
    id: project.id,
    name: isGlobal ? 'Global' : getLastPathSegment(project.worktree),
    path: project.worktree,
    isGlobal,
    
    sessionCount: sessionCounts.get(project.id) ?? 0,
    lastActive: new Date(project.time.updated),
    
    iconColor: project.icon?.color
  }
}
```

---

## 4. Data Access

### 4.1 Access Methods

The UI can access session data through three methods:

#### Option A: Direct File System

Best for: Desktop/Electron apps, CLI tools

```typescript
const STORAGE_BASE = '~/.local/share/opencode/storage'

// Load all projects
const projects = glob(`${STORAGE_BASE}/project/*.json`)
  .map(file => JSON.parse(readFile(file)))

// Load all sessions (all project scopes)
const sessions = glob(`${STORAGE_BASE}/session/**/*.json`)
  .map(file => JSON.parse(readFile(file)))
```

#### Option B: CLI Commands

Best for: Scripts, simple integrations

```bash
# Get sessions as JSON
opencode session list --format json -n 1000

# Pipe to processing
opencode session list --format json | jq '.[] | {id, title, projectId}'
```

#### Option C: HTTP API (Recommended)

Best for: Web UIs, real-time updates

```typescript
const BASE_URL = 'http://localhost:4096'

// Fetch all data
const [projects, sessions] = await Promise.all([
  fetch(`${BASE_URL}/project`).then(r => r.json()),
  fetch(`${BASE_URL}/session`).then(r => r.json())
])

// Subscribe to updates
const events = new EventSource(`${BASE_URL}/event`)
events.onmessage = (e) => {
  const event = JSON.parse(e.data)
  if (event.type.startsWith('session.')) {
    // Handle session create/update/delete
  }
}
```

### 4.2 Recommended Architecture

```
┌──────────────────────────────────────────────────────┐
│                    UI Components                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ Project     │  │ Session     │  │ Session     │  │
│  │ Sidebar     │  │ List/Grid   │  │ Detail      │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│                    State Store                        │
│  ┌─────────────────────────────────────────────────┐ │
│  │ sessions: UISession[]                           │ │
│  │ projects: UIProject[]                           │ │
│  │ filters: FilterState                            │ │
│  │ ui: UIState                                     │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│                   Data Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ API Client   │  │ Transformer  │  │ SSE Client │ │
│  │ (fetch)      │  │ (raw → UI)   │  │ (updates)  │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│              OpenCode Server (port 4096)              │
│  GET /project  │  GET /session  │  GET /event (SSE)  │
└──────────────────────────────────────────────────────┘
```

---

## 5. UI Features

### 5.1 Views

#### Project Sidebar
- List all projects with session counts
- "Global" bucket at top or bottom
- Visual color indicators
- Click to filter sessions

#### Session List
- Display sessions matching current filters
- Show: title, relative time, project badge
- Indicate subagent sessions (icon or indent)
- Click to select / double-click to resume

#### Session Groups (Kanban-style)
- Group by project as columns
- Or group by time period (Today / This Week / Older)
- Drag-and-drop not needed for v1

### 5.2 Interactions

| Action               | Trigger              | Result                          |
| -------------------- | -------------------- | ------------------------------- |
| Filter by project    | Click project        | Show only that project's sessions |
| Search               | Type in search box   | Filter by title substring       |
| Toggle subagents     | Checkbox/toggle      | Show/hide subagent sessions     |
| Sort                 | Click column header  | Sort by updated/created/title   |
| Resume session       | Double-click / button | Open terminal with `opencode -s <id>` |
| View children        | Expand arrow         | Show child sessions inline      |

### 5.3 Filtering Logic

```typescript
function filterSessions(
  sessions: UISession[],
  filters: FilterState
): UISession[] {
  return sessions.filter(session => {
    // Project filter
    if (filters.projectId && session.projectId !== filters.projectId) {
      return false
    }
    
    // Subagent filter
    if (!filters.showSubagents && session.isSubagent) {
      return false
    }
    
    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      if (!session.title.toLowerCase().includes(query)) {
        return false
      }
    }
    
    // Time range filter
    if (filters.timeRange !== 'all') {
      const now = Date.now()
      const cutoff = {
        'today': now - 24 * 60 * 60 * 1000,
        'week': now - 7 * 24 * 60 * 60 * 1000,
        'month': now - 30 * 24 * 60 * 60 * 1000
      }[filters.timeRange]
      
      if (session.updatedAt.getTime() < cutoff) {
        return false
      }
    }
    
    return true
  })
}
```

### 5.4 Grouping Logic

```typescript
function groupSessions(
  sessions: UISession[],
  groupBy: 'project' | 'time' | 'none'
): Map<string, UISession[]> {
  if (groupBy === 'none') {
    return new Map([['all', sessions]])
  }
  
  const groups = new Map<string, UISession[]>()
  
  for (const session of sessions) {
    let key: string
    
    if (groupBy === 'project') {
      key = session.projectName
    } else {
      // Group by time
      const now = Date.now()
      const age = now - session.updatedAt.getTime()
      
      if (age < 24 * 60 * 60 * 1000) {
        key = 'Today'
      } else if (age < 7 * 24 * 60 * 60 * 1000) {
        key = 'This Week'
      } else if (age < 30 * 24 * 60 * 60 * 1000) {
        key = 'This Month'
      } else {
        key = 'Older'
      }
    }
    
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(session)
  }
  
  return groups
}
```

---

## 6. API Integration

### 6.1 Required Endpoints

| Endpoint        | Method | Purpose                    |
| --------------- | ------ | -------------------------- |
| `/project`      | GET    | List all projects          |
| `/session`      | GET    | List all sessions          |
| `/session/:id`  | GET    | Get session details        |
| `/session/:id/children` | GET | Get child sessions |
| `/event`        | GET    | SSE stream for live updates |

### 6.2 Starting the Server

The UI requires OpenCode server to be running:

```bash
# Start headless server
opencode serve --port 4096

# Or with web interface
opencode web --port 4096
```

### 6.3 Event Types to Handle

```typescript
type SessionEvent = 
  | { type: 'session.created', properties: { session: RawSession } }
  | { type: 'session.updated', properties: { session: RawSession } }
  | { type: 'session.deleted', properties: { sessionId: string } }

function handleEvent(event: SessionEvent) {
  switch (event.type) {
    case 'session.created':
      addSession(event.properties.session)
      break
    case 'session.updated':
      updateSession(event.properties.session)
      break
    case 'session.deleted':
      removeSession(event.properties.sessionId)
      break
  }
}
```

---

## 7. Implementation Phases

### Phase 1: Static List (MVP)
- [ ] Fetch sessions and projects from API
- [ ] Display flat list of sessions
- [ ] Show project name for each session
- [ ] Sort by last updated
- [ ] Basic search by title

### Phase 2: Grouping & Filtering
- [ ] Project sidebar with counts
- [ ] Filter by project
- [ ] Toggle subagent visibility
- [ ] Time range filter
- [ ] Group by project or time

### Phase 3: Real-time Updates
- [ ] SSE subscription
- [ ] Live session updates
- [ ] New session notifications
- [ ] Connection status indicator

### Phase 4: Session Actions
- [ ] Resume session (open terminal)
- [ ] View session details
- [ ] Show child sessions
- [ ] Session deletion (with confirmation)

### Phase 5: Kanban View (Optional)
- [ ] Column-based layout by project
- [ ] Drag sessions between projects (if meaningful)
- [ ] Collapsible columns
- [ ] Session cards with rich preview

---

## 8. Technical Considerations

### 8.1 Performance

- **Lazy loading:** With 8,400+ sessions, consider pagination or virtual scrolling
- **Caching:** Cache project data, it changes rarely
- **Debounce:** Debounce search input (300ms)
- **SSE reconnection:** Handle connection drops gracefully

### 8.2 Error Handling

| Error                    | Handling                          |
| ------------------------ | --------------------------------- |
| Server not running       | Show "Start OpenCode server" prompt |
| Network error            | Retry with exponential backoff    |
| Session not found        | Remove from list, show toast      |
| Invalid data             | Log warning, skip item            |

### 8.3 Responsive Design

- **Desktop:** Full sidebar + list + detail panel
- **Tablet:** Collapsible sidebar + list
- **Mobile:** Bottom nav, single view at a time

---

## 9. Out of Scope (Future Enhancements)

- Message/conversation viewer
- Token usage charts and cost analytics
- Semantic search (Smart Fork integration)
- Session export/import UI
- Multi-select and bulk actions
- Session sharing controls
- Keyboard navigation
- Dark/light theme toggle

---

## 10. Success Criteria

### Functional
- [ ] Can view all sessions across all projects
- [ ] Can filter to specific project
- [ ] Can find session by searching title
- [ ] Can resume a session in terminal
- [ ] Updates appear without manual refresh

### Performance
- [ ] Initial load < 2 seconds for 1000 sessions
- [ ] Filter/search response < 100ms
- [ ] SSE updates reflected < 500ms

### Usability
- [ ] Clear visual distinction between projects
- [ ] Subagent sessions identifiable at a glance
- [ ] Intuitive grouping and sorting
- [ ] Works without reading documentation

---

## Appendix A: Sample API Responses

### GET /project

```json
[
  {
    "id": "347ecc8dfdc2fefa0c18102238a126542d1d3574",
    "worktree": "/Users/david/repos/my-project",
    "vcs": "git",
    "time": {
      "created": 1768069868039,
      "updated": 1769257711274
    },
    "icon": {
      "color": "orange"
    }
  },
  {
    "id": "global",
    "worktree": "/",
    "time": {
      "created": 1765242484703,
      "updated": 1769271253477
    }
  }
]
```

### GET /session

```json
[
  {
    "id": "ses_40f3607ebffeSuIRyeqZbXPKpI",
    "title": "Implement user authentication",
    "updated": 1769271652109,
    "created": 1769271326740,
    "projectId": "347ecc8dfdc2fefa0c18102238a126542d1d3574",
    "directory": "/Users/david/repos/my-project"
  }
]
```

---

## Appendix B: Quick Start Commands

```bash
# Start OpenCode server
opencode serve --port 4096

# Test API
curl http://localhost:4096/project | jq .
curl http://localhost:4096/session | jq .

# Watch events
curl -N http://localhost:4096/event
```
