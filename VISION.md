# OpenCode Session Manager

**Status:** Ideation  
**Created:** 2026-01-24

## The Problem

OpenCode sessions are flat. With dozens (or 100+) sessions across multiple projects, the built-in session list becomes unmanageable:

- No hierarchy (sessions don't belong to projects/repos)
- No visual overview of session state
- No Kanban-style organization
- Can't see which sessions are active, stalled, or completed
- Hard to context-switch between parallel workstreams

## Vision

A visual interface for OpenCode session management that provides:

### Core Features

1. **Session Discovery & Parsing**
   - Read OpenCode session files from disk
   - Parse chat history and metadata
   - Extract: repo path, timestamps, message count, last activity

2. **Project Association**
   - Map sessions to repositories/projects
   - Group sessions by folder/workspace
   - Track which sessions belong to which codebase

3. **Visual Dashboard**
   - Kanban board view (Backlog → In Progress → Done)
   - Session cards with preview/summary
   - Filter by project, date, status

4. **Session Operations**
   - Delete sessions (clean up)
   - Reattach to sessions (fork/continue)
   - Archive completed sessions
   - Tag/categorize sessions

### Technical Questions to Answer

1. **Where does OpenCode store sessions?**
   - File format (JSON? SQLite?)
   - Location (`~/.local/share/opencode/`?)
   - What metadata is available?

2. **How to read session history programmatically?**
   - Parse message format
   - Extract tool calls, file changes
   - Identify session "state" (active, stalled, complete)

3. **How to reattach/fork sessions?**
   - OpenCode CLI flags
   - Session ID mechanism

4. **What visualization approach?**
   - Web dashboard (like MyInspect)
   - TUI (terminal-based)
   - Integration with existing tools

## Relationship to Other Projects

| Project | Relationship |
|---------|-------------|
| `MyInspect` | Background agent orchestrator - could integrate session view |
| `opensync-pocketbase` | Session dashboard - similar visualization needs |
| This project | Focused specifically on OpenCode session data |

## Next Steps

1. [ ] Research OpenCode session storage format
2. [ ] Build session parser/reader
3. [ ] Design data model for session metadata
4. [ ] Prototype simple dashboard view
5. [ ] Decide: standalone tool vs MyInspect integration

---

*This is a planning document. No code yet.*
