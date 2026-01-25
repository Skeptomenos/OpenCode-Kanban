# OpenCode Sessions: Comprehensive Research Report

> **Date:** 2026-01-24  
> **OpenCode Version:** 1.1.34  
> **System:** macOS (darwin)

---

## Executive Summary

OpenCode sessions are **JSON-based, file-system stored conversation units** that persist all interactions between users and the AI agent. Sessions are organized hierarchically by project, support parent-child relationships for subagents, and are fully machine-readable through both file system access and HTTP/SDK APIs.

---

## Table of Contents

1. [Session Storage Architecture](#1-session-storage-architecture)
2. [Session Data Structure](#2-session-data-structure)
3. [Session Lifecycle](#3-session-lifecycle)
4. [Compaction System](#4-compaction-system)
5. [Parent-Child Session Relationships](#5-parent-child-session-relationships)
6. [Machine-Readable Access](#6-machine-readable-access)
7. [Smart Fork (Semantic Search)](#7-smart-fork-semantic-search)
8. [Session Metrics & Statistics](#8-session-metrics--statistics)
9. [Project-Session Relationship](#9-project-session-relationship)
10. [Key Takeaways](#10-key-takeaways)
11. [Practical Use Cases](#11-practical-use-cases)

---

## 1. Session Storage Architecture

### 1.1 Primary Storage Location

```
~/.local/share/opencode/storage/
├── project/                    # Project registry
│   └── {sha1_hash}.json       # Project metadata (200-900 bytes each)
├── session/                    # Session metadata
│   ├── global/                 # Global sessions (not tied to a project)
│   │   └── ses_{id}.json      # Session metadata (400-800 bytes each)
│   └── {project_hash}/         # Project-specific sessions
│       └── ses_{id}.json
├── message/                    # Message storage
│   └── ses_{session_id}/       # One directory per session
│       └── msg_{id}.json      # Message metadata (700 bytes - 226KB)
├── part/                       # Message parts (content storage)
│   └── msg_{message_id}/       # One directory per message
│       └── prt_{id}.json      # Actual text/tool content
├── session_diff/               # Session diffs for undo/redo
│   └── ses_{id}.json          # Diff data (2 bytes - 680KB)
└── todo/                       # Todo state per session
    └── ses_{id}.json
```

### 1.2 Related Storage Directories

| Directory | Purpose | Typical Size |
|-----------|---------|--------------|
| `~/.local/share/opencode/smart-fork/` | LanceDB vector database for semantic search | 4.6 GB |
| `~/.local/share/opencode/snapshot/` | Git-based file snapshots per project | 2.3 GB |
| `~/.local/share/opencode/exports/` | Exported session markdown files | ~120 KB |
| `~/.local/share/opencode/log/` | Application logs | ~832 KB |
| `~/.local/share/opencode/tool-output/` | Large tool output files | ~104 MB |
| `~/.local/share/opencode/bin/` | Bundled binaries (ripgrep, node_modules) | ~249 MB |

### 1.3 Configuration Storage

```
~/.config/opencode/
├── opencode.json              # Main configuration
├── skills/                    # 27+ skill directories
├── commands/                  # Custom command definitions (.md files)
├── plugins/                   # Plugin code
├── agents/                    # Agent definitions
└── auth.json                  # OAuth tokens (in ~/.local/share/opencode/)
```

### 1.4 ID Naming Conventions

| Entity | Pattern | Example |
|--------|---------|---------|
| Project | 40-char SHA1 hash | `347ecc8dfdc2fefa0c18102238a126542d1d3574` |
| Session | `ses_{hex}ffe{random}` | `ses_40f35e91fffetws923g7sFzh41` |
| Message | `msg_{hex}{random}` | `msg_bf0c653a7001Y9Bj83tmPWZrpK` |
| Part | `prt_{hex}{random}` | `prt_19b2ede42d055o9m9oi` |
| Tool output | `tool_{hex}{random}` | `tool_bcd94c27e001lDRZadZowpu7LR` |

---

## 2. Session Data Structure

### 2.1 Session Object

**Location:** `storage/session/{scope}/ses_{id}.json`

```json
{
  "id": "ses_40f35e91fffetws923g7sFzh41",
  "slug": "playful-lagoon",
  "version": "1.1.34",
  "projectID": "global",
  "directory": "/Users/david.helmus/repos/project-name",
  "parentID": "ses_40f3607ebffeSuIRyeqZbXPKpI",
  "title": "Session title generated from first prompt",
  "permission": [
    {
      "permission": "todowrite",
      "action": "deny",
      "pattern": "*"
    },
    {
      "permission": "task",
      "action": "deny",
      "pattern": "*"
    }
  ],
  "time": {
    "created": 1769271334624,
    "updated": 1769271595598
  },
  "summary": {
    "additions": 0,
    "deletions": 0,
    "files": 0
  }
}
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique session identifier |
| `slug` | string | Human-readable slug (e.g., "playful-lagoon") |
| `version` | string | OpenCode version that created the session |
| `projectID` | string | "global" or SHA1 hash of project worktree |
| `directory` | string | Working directory when session was created |
| `parentID` | string? | Parent session ID (for subagent sessions) |
| `title` | string | Auto-generated or user-provided title |
| `permission` | array | Tool restrictions (mainly for subagents) |
| `time.created` | number | Unix timestamp in milliseconds |
| `time.updated` | number | Last activity timestamp |
| `summary` | object | File change statistics |

### 2.2 Message Object

**Location:** `storage/message/ses_{session_id}/msg_{id}.json`

#### User Message

```json
{
  "id": "msg_bf0c9f817001d7cW2iCtJlHHTe",
  "sessionID": "ses_40f3607ebffeSuIRyeqZbXPKpI",
  "role": "user",
  "time": {
    "created": 1769271326748
  },
  "summary": {
    "title": "Open code sessions: storage, structure, management",
    "diffs": []
  },
  "agent": "build",
  "model": {
    "providerID": "genaipilot-vertex-anthropic",
    "modelID": "claude-opus-4-5@20251101"
  }
}
```

#### Assistant Message

```json
{
  "id": "msg_bf0c9f824001g4h81NwMLF8TL7",
  "sessionID": "ses_40f3607ebffeSuIRyeqZbXPKpI",
  "role": "assistant",
  "time": {
    "created": 1769271326756,
    "completed": 1769271595611
  },
  "parentID": "msg_bf0c9f817001d7cW2iCtJlHHTe",
  "modelID": "claude-opus-4-5@20251101",
  "providerID": "genaipilot-vertex-anthropic",
  "mode": "build",
  "agent": "build",
  "path": {
    "cwd": "/Users/david.helmus/repos/project",
    "root": "/"
  },
  "cost": 0,
  "tokens": {
    "input": 2,
    "output": 328,
    "reasoning": 0,
    "cache": {
      "read": 0,
      "write": 80169
    }
  },
  "finish": "tool-calls"
}
```

**Message Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `role` | string | "user" or "assistant" |
| `parentID` | string? | For assistant messages, links to user prompt |
| `mode` | string | "build" or "plan" |
| `agent` | string | Agent type (build, plan, explore, etc.) |
| `tokens` | object | Token usage breakdown |
| `finish` | string | How message ended: "end_turn", "tool-calls", etc. |

### 2.3 Message Parts

**Location:** `storage/part/msg_{message_id}/prt_{id}.json`

Parts store the actual content of messages. Each message can have multiple parts.

#### Text Part (User Input)

```json
{
  "id": "prt_bf0c9f817002ZPzWQ1T9LYbpUr",
  "sessionID": "ses_40f3607ebffeSuIRyeqZbXPKpI",
  "messageID": "msg_bf0c9f817001d7cW2iCtJlHHTe",
  "type": "text",
  "text": "The user's actual prompt text goes here..."
}
```

#### Step Start Part

```json
{
  "id": "prt_bf0ca03dd001EX5RhP8hwOzI8U",
  "sessionID": "ses_...",
  "messageID": "msg_...",
  "type": "step-start"
}
```

#### Tool Part

```json
{
  "id": "prt_bf0ca16e1001NVuaFdC8QS5E2q",
  "sessionID": "ses_...",
  "messageID": "msg_...",
  "type": "tool",
  "callID": "toolu_vrtx_019JsZXPwk2vCvHc3tHdenGN",
  "tool": "webfetch",
  "state": {
    "status": "completed",
    "input": {
      "url": "https://opencode.ai/docs",
      "format": "markdown"
    },
    "output": "... tool output content ...",
    "title": "https://opencode.ai/docs (text/html)",
    "metadata": {
      "truncated": false
    },
    "time": {
      "start": 1769271335637,
      "end": 1769271335839
    }
  }
}
```

**Part Types:**

| Type | Description | Contains |
|------|-------------|----------|
| `text` | Plain text content | `text` field with content |
| `step-start` | Marks beginning of processing | No additional fields |
| `tool` | Tool invocation | `tool`, `callID`, `state` with input/output |
| `image` | Image content | Image data/reference |
| `file` | File reference | File path and content |

---

## 3. Session Lifecycle

### 3.1 Creating Sessions

#### Via TUI
```bash
# Start new session in current directory
opencode

# Start with specific project
opencode /path/to/project
```

#### Via CLI
```bash
# One-shot session
opencode run "Explain how closures work in JavaScript"

# With specific model
opencode run -m anthropic/claude-sonnet-4-5 "Hello"
```

#### Via SDK
```typescript
import { createOpencodeClient } from "@opencode-ai/sdk"

const client = createOpencodeClient({ baseUrl: "http://localhost:4096" })
const session = await client.session.create({
  body: { title: "My new session" }
})
```

#### Via HTTP API
```bash
curl -X POST http://localhost:4096/session \
  -H "Content-Type: application/json" \
  -d '{"title": "New Session"}'
```

### 3.2 Session States

Sessions don't have explicit status fields but can be understood as:

| State | Description | Indicators |
|-------|-------------|------------|
| **Active** | Currently being used | TUI attached, recent `time.updated` |
| **Idle** | Preserved but not in use | No active connection |
| **Shared** | Published to opencode.ai | Has share URL |
| **Child** | Subagent session | Has `parentID` field |

### 3.3 Continuing Sessions

```bash
# Continue last session
opencode -c
opencode --continue

# Continue specific session
opencode -s ses_40f3607ebffeSuIRyeqZbXPKpI
opencode --session ses_40f3607ebffeSuIRyeqZbXPKpI
```

#### TUI Commands
```
/sessions    # Open session selector
/resume      # Alias for /sessions
/continue    # Alias for /sessions
```

**Keybind:** `ctrl+x l`

### 3.4 Starting New Sessions

```
/new         # Start fresh session
/clear       # Alias for /new
```

**Keybind:** `ctrl+x n`

### 3.5 Session Persistence

- Sessions are **never automatically deleted**
- All sessions persist indefinitely in storage
- Can be resumed at any time
- Manual deletion via CLI or API:
  ```bash
  # Via CLI (if available)
  opencode session delete <session_id>
  
  # Via API
  curl -X DELETE http://localhost:4096/session/ses_xyz
  ```

---

## 4. Compaction System

### 4.1 What is Compaction?

Compaction is **context window management within a single session**. It prevents sessions from exceeding the model's context limit by summarizing older content.

> **Important:** Compaction does NOT delete or prune old sessions. It summarizes content within one session to fit context limits.

### 4.2 Configuration

```json
{
  "$schema": "https://opencode.ai/config.json",
  "compaction": {
    "auto": true,
    "prune": true
  }
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `auto` | `true` | Automatically compact when context is full |
| `prune` | `true` | Remove old tool outputs to save tokens |

### 4.3 Manual Compaction

#### TUI Command
```
/compact
/summarize   # Alias
```

**Keybind:** `ctrl+x c`

#### SDK
```typescript
await client.session.summarize({
  path: { id: "ses_..." },
  body: { providerID: "anthropic", modelID: "claude-sonnet-4-5" }
})
```

#### HTTP API
```bash
curl -X POST http://localhost:4096/session/ses_xyz/summarize \
  -H "Content-Type: application/json" \
  -d '{"providerID": "anthropic", "modelID": "claude-sonnet-4-5"}'
```

### 4.4 How Compaction Works

1. **Trigger:** Context approaches model's limit
2. **Process:** OpenCode summarizes older messages
3. **Result:** Summary replaces detailed tool outputs and lengthy exchanges
4. **Storage:** Original messages remain in storage (not deleted)
5. **Pruning:** With `prune: true`, verbose tool outputs are removed from context (but preserved in storage)

### 4.5 Disabling Auto-Compaction

```bash
# Environment variable
export OPENCODE_DISABLE_AUTOCOMPACT=true
```

Or in config:
```json
{
  "compaction": {
    "auto": false
  }
}
```

---

## 5. Parent-Child Session Relationships

### 5.1 Subagent Sessions

When using the `Task` tool to spawn subagents, OpenCode creates child sessions:

```json
{
  "id": "ses_40f35e91fffetws923g7sFzh41",
  "parentID": "ses_40f3607ebffeSuIRyeqZbXPKpI",
  "title": "Explore OpenCode session storage (@explore subagent)",
  "permission": [
    { "permission": "todowrite", "action": "deny", "pattern": "*" },
    { "permission": "todoread", "action": "deny", "pattern": "*" },
    { "permission": "task", "action": "deny", "pattern": "*" }
  ]
}
```

**Key Characteristics:**
- `parentID` links child to parent session
- `permission` array restricts tools (prevents recursive subagents)
- Title often includes agent type: `"(@explore subagent)"`

### 5.2 Getting Child Sessions

#### SDK
```typescript
const children = await client.session.children({
  path: { id: "ses_parent_id" }
})
```

#### HTTP API
```bash
curl http://localhost:4096/session/ses_parent_id/children
```

### 5.3 Session Forking

Create a new session branching from a specific message:

#### SDK
```typescript
const forked = await client.session.fork({
  path: { id: "ses_original" },
  body: { messageID: "msg_branch_point" }
})
```

#### HTTP API
```bash
curl -X POST http://localhost:4096/session/ses_xyz/fork \
  -H "Content-Type: application/json" \
  -d '{"messageID": "msg_abc"}'
```

---

## 6. Machine-Readable Access

### 6.1 Direct File System Access

All data is JSON - fully parseable:

```bash
# List all global sessions
ls ~/.local/share/opencode/storage/session/global/

# Read a session
cat ~/.local/share/opencode/storage/session/global/ses_*.json | jq .

# Read messages for a session (sorted by time)
cat ~/.local/share/opencode/storage/message/ses_xyz/*.json | jq -s 'sort_by(.time.created)'

# Read all parts for a message
cat ~/.local/share/opencode/storage/part/msg_abc/*.json | jq .

# Find sessions by title
grep -l "search term" ~/.local/share/opencode/storage/session/global/*.json
```

### 6.2 CLI Commands

```bash
# List sessions (table format)
opencode session list

# List sessions (JSON format)
opencode session list --format json

# Limit results
opencode session list -n 10 --format json

# Export session as JSON
opencode export <session_id>

# Import session from file
opencode import session.json

# Import from share URL
opencode import https://opncd.ai/s/abc123

# View statistics
opencode stats --days 7 --models
```

### 6.3 SDK (TypeScript/JavaScript)

```typescript
import { createOpencode, createOpencodeClient } from "@opencode-ai/sdk"

// Option 1: Create server + client
const { client, server } = await createOpencode({
  port: 4096,
  hostname: "127.0.0.1"
})

// Option 2: Connect to existing server
const client = createOpencodeClient({
  baseUrl: "http://localhost:4096"
})

// List all sessions
const sessions = await client.session.list()

// Get session details
const session = await client.session.get({
  path: { id: "ses_..." }
})

// Get messages with parts
const messages = await client.session.messages({
  path: { id: "ses_..." }
})

// Get specific message
const message = await client.session.message({
  path: { id: "ses_...", messageID: "msg_..." }
})

// Create new session
const newSession = await client.session.create({
  body: { title: "My Session" }
})

// Send prompt and get response
const result = await client.session.prompt({
  path: { id: "ses_..." },
  body: {
    model: { providerID: "anthropic", modelID: "claude-sonnet-4-5" },
    parts: [{ type: "text", text: "Hello!" }]
  }
})

// Inject context without AI response
await client.session.prompt({
  path: { id: "ses_..." },
  body: {
    noReply: true,
    parts: [{ type: "text", text: "Context to remember..." }]
  }
})

// Delete session
await client.session.delete({ path: { id: "ses_..." } })

// Share session
await client.session.share({ path: { id: "ses_..." } })

// Get todo list for session
const todos = await client.session.todo({ path: { id: "ses_..." } })
```

### 6.4 HTTP API (REST)

Start the server:
```bash
opencode serve --port 4096

# With authentication
OPENCODE_SERVER_PASSWORD=secret opencode serve
```

#### Session Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/session` | List all sessions |
| `POST` | `/session` | Create new session |
| `GET` | `/session/:id` | Get session details |
| `DELETE` | `/session/:id` | Delete session |
| `PATCH` | `/session/:id` | Update session properties |
| `GET` | `/session/:id/children` | Get child sessions |
| `GET` | `/session/:id/todo` | Get todo list |
| `POST` | `/session/:id/fork` | Fork session at message |
| `POST` | `/session/:id/abort` | Abort running session |
| `POST` | `/session/:id/share` | Share session |
| `DELETE` | `/session/:id/share` | Unshare session |
| `GET` | `/session/:id/diff` | Get file diffs |
| `POST` | `/session/:id/summarize` | Compact/summarize session |
| `POST` | `/session/:id/revert` | Undo message |
| `POST` | `/session/:id/unrevert` | Redo message |

#### Message Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/session/:id/message` | List messages |
| `POST` | `/session/:id/message` | Send message (sync) |
| `GET` | `/session/:id/message/:msgId` | Get message details |
| `POST` | `/session/:id/prompt_async` | Send message (async) |
| `POST` | `/session/:id/command` | Execute slash command |
| `POST` | `/session/:id/shell` | Run shell command |

### 6.5 Server-Sent Events (Real-time)

```typescript
// Subscribe to events
const events = await client.event.subscribe()

for await (const event of events.stream) {
  console.log("Event:", event.type, event.properties)
  
  // Event types include:
  // - session.created
  // - session.updated
  // - session.deleted
  // - message.created
  // - message.updated
  // - part.created
  // etc.
}
```

#### HTTP SSE
```bash
curl -N http://localhost:4096/event
```

### 6.6 OpenAPI Specification

View the full API spec:
```
http://localhost:4096/doc
```

---

## 7. Smart Fork (Semantic Search)

### 7.1 Purpose

Smart Fork enables **semantic search across all sessions** to find relevant prior context when starting new work.

### 7.2 Storage Structure

```
~/.local/share/opencode/smart-fork/
├── lance/sessions.lance/       # LanceDB vector database
│   ├── data/                   # .lance data files
│   ├── _versions/              # .manifest files
│   └── _transactions/          # .txn files
└── sync-state.json             # Tracks indexed sessions
```

### 7.3 Sync State

```json
{
  "last_sync": "2026-01-24T...",
  "sessions": {
    "ses_xyz": 1769271328,
    "ses_abc": 1769270000
  }
}
```

### 7.4 Status Check

```typescript
const status = await smart_fork_status()
// Returns:
{
  "sessions": 8407,
  "chunks": 324897,
  "last_sync": null,
  "database_path": "~/.local/share/opencode/smart-fork/lance"
}
```

### 7.5 Searching Sessions

```typescript
const results = await smart_fork_search({
  query: "implement webhook signature verification",
  scope: "global"  // or "repo"
})

// Returns:
{
  "matches": [
    {
      "rank": 1,
      "session_id": "ses_abc123",
      "score_percent": "73%",
      "repo": "my-api",
      "time_ago": "2 days ago",
      "snippet": "Implemented rate limiting using token bucket...",
      "fork_command": "opencode --session ses_abc123"
    }
  ],
  "top_result_fork_command": "opencode --session ses_abc123"
}
```

### 7.6 Syncing the Index

```typescript
// Incremental sync (new/modified only)
await smart_fork_sync({ full: false })

// Full re-index
await smart_fork_sync({ full: true })
```

---

## 8. Session Metrics & Statistics

### 8.1 CLI Stats Command

```bash
# Last 7 days
opencode stats --days 7

# Include model breakdown
opencode stats --days 7 --models

# Include tool usage
opencode stats --tools 10

# Filter by project
opencode stats --project
```

**Example Output:**
```
┌────────────────────────────────────────────────────────┐
│                       OVERVIEW                         │
├────────────────────────────────────────────────────────┤
│Sessions                                          3,307 │
│Messages                                         43,065 │
│Days                                                  7 │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                    COST & TOKENS                       │
├────────────────────────────────────────────────────────┤
│Total Cost                                       $31.78 │
│Avg Cost/Day                                      $4.54 │
│Avg Tokens/Session                                35.7K │
│Median Tokens/Session                              2.4K │
│Input                                            103.8M │
│Output                                            13.9M │
│Cache Read                                      3438.6M │
│Cache Write                                      221.1M │
└────────────────────────────────────────────────────────┘
```

### 8.2 Per-Message Token Tracking

Each assistant message contains detailed token usage:

```json
{
  "tokens": {
    "input": 2,
    "output": 328,
    "reasoning": 0,
    "cache": {
      "read": 0,
      "write": 80169
    }
  },
  "cost": 0.0123
}
```

### 8.3 Session Status Endpoint

```bash
curl http://localhost:4096/session/status
```

Returns status for all active sessions:
```json
{
  "ses_xyz": { "status": "running", "lastActivity": 1769271595598 },
  "ses_abc": { "status": "idle", "lastActivity": 1769270000000 }
}
```

---

## 9. Project-Session Relationship

### 9.1 Project Registry

**Location:** `storage/project/{sha1_hash}.json`

```json
{
  "id": "347ecc8dfdc2fefa0c18102238a126542d1d3574",
  "worktree": "/Users/david.helmus/repos/ai-tooling/ralphus",
  "vcs": "git",
  "sandboxes": [],
  "time": {
    "created": 1768069868039,
    "updated": 1769257711274,
    "initialized": 1768070099147
  },
  "icon": {
    "color": "orange",
    "url": "data:image/png;base64,..."
  }
}
```

**Fields:**

| Field | Description |
|-------|-------------|
| `id` | SHA1 hash of worktree path |
| `worktree` | Absolute path to project |
| `vcs` | Version control system ("git") |
| `sandboxes` | Associated worktree sandboxes |
| `time.initialized` | When AGENTS.md was created |
| `icon` | Optional project icon/color |

### 9.2 Global Project

Sessions not tied to a specific git repository use `projectID: "global"`:

```json
{
  "id": "global",
  "worktree": "/",
  "time": {
    "created": 1765242484703,
    "updated": 1769271253477,
    "initialized": 1768417044564
  },
  "icon": {
    "color": "cyan"
  }
}
```

### 9.3 Session-Project Mapping

```
session.projectID = "global"
  → Session in storage/session/global/

session.projectID = "347ecc8dfdc2..."
  → Session in storage/session/347ecc8dfdc2.../
  → Project info in storage/project/347ecc8dfdc2....json
```

### 9.4 Listing Projects

```typescript
// SDK
const projects = await client.project.list()
const current = await client.project.current()
```

```bash
# HTTP API
curl http://localhost:4096/project
curl http://localhost:4096/project/current
```

---

## 10. Key Takeaways

| Aspect | Finding |
|--------|---------|
| **Storage Format** | Pure JSON files, no SQLite or other databases |
| **Total Sessions** | 8,400+ sessions tracked |
| **Message Parts** | 146,866+ across all sessions |
| **Total Storage** | ~13 GB |
| **Hierarchy** | Project → Session → Message → Part |
| **Machine Access** | File system, CLI, SDK, HTTP API, SSE |
| **Compaction** | Summarizes within sessions, not cross-session |
| **Parent-Child** | Subagent sessions link via `parentID` |
| **Semantic Search** | LanceDB with 324,897 chunks indexed |
| **Persistence** | Sessions never auto-deleted, always resumable |
| **Real-time** | SSE events for live updates |

---

## 11. Practical Use Cases

### 11.1 Building a Session Manager

```typescript
import * as fs from 'fs'
import * as path from 'path'

const STORAGE_BASE = path.join(process.env.HOME!, '.local/share/opencode/storage')

interface Session {
  id: string
  title: string
  projectID: string
  directory: string
  parentID?: string
  time: { created: number; updated: number }
}

// List all sessions with message counts
function listSessionsWithCounts(): Array<Session & { messageCount: number }> {
  const sessionsDir = path.join(STORAGE_BASE, 'session/global')
  const messagesDir = path.join(STORAGE_BASE, 'message')
  
  return fs.readdirSync(sessionsDir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const session: Session = JSON.parse(
        fs.readFileSync(path.join(sessionsDir, f), 'utf8')
      )
      const sessionMsgDir = path.join(messagesDir, session.id)
      const messageCount = fs.existsSync(sessionMsgDir)
        ? fs.readdirSync(sessionMsgDir).length
        : 0
      return { ...session, messageCount }
    })
    .sort((a, b) => b.time.updated - a.time.updated)
}
```

### 11.2 Extracting Conversation History

```typescript
interface Message {
  id: string
  role: 'user' | 'assistant'
  time: { created: number; completed?: number }
}

interface Part {
  type: 'text' | 'tool' | 'step-start'
  text?: string
  tool?: string
  state?: { input: any; output: any }
}

function getConversation(sessionId: string) {
  const messagesDir = path.join(STORAGE_BASE, 'message', sessionId)
  const partsDir = path.join(STORAGE_BASE, 'part')
  
  const messages = fs.readdirSync(messagesDir)
    .map(f => JSON.parse(fs.readFileSync(path.join(messagesDir, f), 'utf8')) as Message)
    .sort((a, b) => a.time.created - b.time.created)
  
  return messages.map(msg => {
    const msgPartsDir = path.join(partsDir, msg.id)
    const parts = fs.existsSync(msgPartsDir)
      ? fs.readdirSync(msgPartsDir).map(f => 
          JSON.parse(fs.readFileSync(path.join(msgPartsDir, f), 'utf8')) as Part
        )
      : []
    
    return {
      role: msg.role,
      timestamp: new Date(msg.time.created).toISOString(),
      content: parts
        .filter(p => p.type === 'text')
        .map(p => p.text)
        .join('\n'),
      tools: parts
        .filter(p => p.type === 'tool')
        .map(p => ({ tool: p.tool, input: p.state?.input }))
    }
  })
}
```

### 11.3 Session Dashboard with SDK

```typescript
import { createOpencodeClient } from "@opencode-ai/sdk"

async function buildDashboard() {
  const client = createOpencodeClient({ baseUrl: "http://localhost:4096" })
  
  // Get all sessions
  const sessions = await client.session.list()
  
  // Group by project
  const byProject = sessions.data!.reduce((acc, session) => {
    const key = session.projectId || 'global'
    if (!acc[key]) acc[key] = []
    acc[key].push(session)
    return acc
  }, {} as Record<string, typeof sessions.data>)
  
  // Get current project info
  const project = await client.project.current()
  
  // Subscribe to real-time updates
  const events = await client.event.subscribe()
  for await (const event of events.stream) {
    if (event.type.startsWith('session.')) {
      console.log('Session update:', event)
      // Update dashboard state
    }
  }
}
```

### 11.4 Exporting Sessions to Markdown

```bash
# Built-in export (opens in editor)
opencode export ses_xyz

# Export to file
opencode export ses_xyz > session-export.json
```

Or programmatically:
```typescript
async function exportToMarkdown(sessionId: string): Promise<string> {
  const client = createOpencodeClient({ baseUrl: "http://localhost:4096" })
  
  const session = await client.session.get({ path: { id: sessionId } })
  const messages = await client.session.messages({ path: { id: sessionId } })
  
  let md = `# ${session.data!.title}\n\n`
  md += `**Session ID:** ${session.data!.id}\n`
  md += `**Created:** ${new Date(session.data!.time.created).toISOString()}\n\n`
  md += `---\n\n`
  
  for (const { info, parts } of messages.data!) {
    const role = info.role === 'user' ? 'User' : 'Assistant'
    md += `## ${role}\n\n`
    
    for (const part of parts) {
      if (part.type === 'text') {
        md += `${part.text}\n\n`
      } else if (part.type === 'tool') {
        md += `\`\`\`\nTool: ${part.tool}\n\`\`\`\n\n`
      }
    }
    md += `---\n\n`
  }
  
  return md
}
```

---

## Appendix A: Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENCODE_DISABLE_AUTOCOMPACT` | Disable automatic context compaction |
| `OPENCODE_DISABLE_PRUNE` | Disable pruning old data |
| `OPENCODE_CONFIG` | Custom config file path |
| `OPENCODE_CONFIG_DIR` | Custom config directory |
| `OPENCODE_SERVER_PASSWORD` | Enable HTTP basic auth |
| `OPENCODE_SERVER_USERNAME` | Override basic auth username |
| `OPENCODE_AUTO_SHARE` | Automatically share sessions |

---

## Appendix B: Related Documentation

- [OpenCode Intro](https://opencode.ai/docs/)
- [CLI Reference](https://opencode.ai/docs/cli/)
- [TUI Commands](https://opencode.ai/docs/tui/)
- [SDK Documentation](https://opencode.ai/docs/sdk/)
- [Server API](https://opencode.ai/docs/server/)
- [Configuration](https://opencode.ai/docs/config/)

---

## Appendix C: Quick Reference

### Session Commands

| Action | TUI | CLI | Keybind |
|--------|-----|-----|---------|
| New session | `/new` | `opencode` | `ctrl+x n` |
| List sessions | `/sessions` | `opencode session list` | `ctrl+x l` |
| Continue last | - | `opencode -c` | - |
| Continue specific | - | `opencode -s <id>` | - |
| Compact | `/compact` | - | `ctrl+x c` |
| Share | `/share` | - | `ctrl+x s` |
| Export | `/export` | `opencode export <id>` | `ctrl+x x` |
| Undo | `/undo` | - | `ctrl+x u` |
| Redo | `/redo` | - | `ctrl+x r` |
