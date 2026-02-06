# OpenCode Server Mapping + Quality Fixes ExecPlan

This ExecPlan is a living document. The sections Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds.

This plan must be maintained in accordance with /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/PLANS_guide.md.

## Purpose / Big Picture

After this change, a user can connect OpenKanban to a single OpenCode server (global base URL for MVP), map many OpenCode projects (directories) into one OpenKanban project, and safely link OpenCode sessions to issues only when the session’s OpenCode project belongs to that OpenKanban project. The UI will surface OpenCode project hierarchy derived from directory paths, and session links will produce deterministic OpenCode session URLs. Additionally, all previously discovered quality issues will be resolved and the project will build and lint cleanly. A user can see it working by mapping a project in the UI, linking a session to an issue, and then opening the session URL that is generated from the base URL, OpenCode project ID, and session ID.

## Progress

- [x] (2026-02-06 00:00Z) Captured architecture requirements and documented the plan scope.
- [ ] (2026-02-06 00:00Z) Install dependencies and re-run build, lint, and tests to establish a clean baseline (blocked: registry.npmjs.org not reachable from this environment).
- [ ] (2026-02-06 00:00Z) Fix all previously discovered quality issues unrelated to OpenCode mapping.
- [ ] (2026-02-06 00:00Z) Implement OpenCode server adapter and global base URL configuration.
- [ ] (2026-02-06 00:00Z) Add OpenCode project mapping storage, API, and UI.
- [ ] (2026-02-06 00:00Z) Enforce session-link validation against project mappings.
- [ ] (2026-02-06 00:00Z) Add tests and validation steps, and verify the user-visible flow.

## Surprises & Discoveries

- Observation: Build and lint fail because dependencies are not installed, so next and eslint are missing.
  Evidence: running pnpm run build yields “next: command not found”; pnpm run lint yields “eslint: command not found”.
- Observation: pnpm install cannot reach registry.npmjs.org from this environment, so dependencies cannot be installed here.
  Evidence: pnpm install fails with ENOTFOUND for registry.npmjs.org.
- Observation: The OpenCode server host alfreds-home is not resolvable from this environment.
  Evidence: curl to http://alfreds-home:8472/... returns “Could not resolve host: alfreds-home”.
- Observation: Attempting to start opencode serve in this environment fails with a models.dev connectivity error and then an EPERM error before a log file is created.
  Evidence: opencode serve reports “Unable to connect… Failed to fetch models.dev” and exits with EPERM, and no new log appears in ~/.local/share/opencode/log.
- Observation: Even with opencode serve running on the host, this environment cannot reach http://127.0.0.1:4096/doc.
  Evidence: curl to http://127.0.0.1:4096/doc returns “Couldn’t connect to server”.
- Observation: On the host, /doc responds 200 with Content-Type application/json but zero content-length, and /openapi.json serves the OpenCode web UI HTML, not JSON.
  Evidence: user-provided curl outputs show empty /doc and HTML at /openapi.json; jq fails to parse.
- Observation: /doc.json, /doc/openapi.json, and /openapi.yaml also serve the OpenCode web UI HTML, not OpenAPI JSON.
  Evidence: user-provided curl outputs show HTML for all three paths.
- Observation: OpenCode web UI uses JSON API endpoints at the server root (not under /api). Projects are fetched from GET /project, sessions from GET /session with directory/roots/limit query params, and session messages from GET /session/{id}/message with directory/limit query params.
  Evidence: HAR capture from 127.0.0.1:4096 shows GET /project, GET /session?directory=...&roots=true&limit=55, and GET /session/{id}/message?directory=...&limit=200 returning application/json.
- Observation: README links to docs that are not present in docs/.
  Evidence: docs/ROADMAP.md, docs/TECH.md, docs/QUALITY.md, docs/CONTRACT.md are missing.

## Decision Log

- Decision: OpenCode base URL is global for MVP, but design for multiple servers long term.
  Rationale: user requirement; simplify initial integration while leaving room for extension.
  Date/Author: 2026-02-06 / user

- Decision: One OpenCode project may only belong to one OpenKanban project, but one OpenKanban project may contain many OpenCode projects (n:1).
  Rationale: user requirement for mapping and organization by boards within a project.
  Date/Author: 2026-02-06 / user

- Decision: Directory paths determine OpenCode project hierarchy; OpenCode itself does not supply hierarchy.
  Rationale: user requirement; hierarchy inferred from directory nesting.
  Date/Author: 2026-02-06 / user

- Decision: Label-based issue filtering is not required right now.
  Rationale: user requirement; defer label filtering implementation.
  Date/Author: 2026-02-06 / user

- Decision: Migrate to structured logging with a server-side JSON logger (recommend Pino) and no console logging in production.
  Rationale: project logging standards require structured logs; current logger violates standards.
  Date/Author: 2026-02-06 / assistant recommendation, pending confirmation

- Decision: Each OpenKanban project will have a dedicated settings tab for mapping OpenCode projects.
  Rationale: user requirement to keep mapping scoped and discoverable.
  Date/Author: 2026-02-06 / user

- Decision: The mapping UI will show OpenCode projects as a hierarchical tree derived from directory paths.
  Rationale: user requirement; hierarchy inferred from directory nesting.
  Date/Author: 2026-02-06 / user

- Decision: Mapping UI supports multi-select with a single “Add” action, and also allows adding one at a time.
  Rationale: user requirement for flexibility.
  Date/Author: 2026-02-06 / user

- Decision: If an OpenCode project is already mapped to a different OpenKanban project, show a warning and point to that project instead of silently re-mapping.
  Rationale: user requirement to prevent accidental reassignment.
  Date/Author: 2026-02-06 / user

- Decision: Session linking must be search-driven and server-filtered to avoid loading thousands of sessions.
  Rationale: user requirement that session counts are large; avoid loading all sessions.
  Date/Author: 2026-02-06 / assistant assumption, confirm with user

- Decision: The project overview page will display boards as cards.
  Rationale: user requirement for visual board cards.
  Date/Author: 2026-02-06 / user

- Decision: Session link dialog shows the most recent 10 sessions by default, and loads more only when the user searches.
  Rationale: user requirement to keep initial load light while still showing useful defaults.
  Date/Author: 2026-02-06 / user

- Decision: V1 only needs to link sessions as external URLs; transcript streaming is deferred. Keep the current SessionViewer but accept the OpenCode server message shape without normalizing timestamps.
  Rationale: user requirement to preserve current UX while deferring richer message handling.
  Date/Author: 2026-02-06 / user

## Outcomes & Retrospective

Pending completion. This section will summarize what shipped and any gaps.

## Context and Orientation

OpenKanban is a Next.js App Router application with a local SQLite database for project management data and a separate OpenCode data source for sessions and projects. PM data is stored in SQLite through Drizzle ORM. The data model centers on issues in /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/src/lib/db/schema.ts, where projects are issues with type “project” and hierarchy is represented via parentId. Boards are stored separately, with filters that may include a project parentId.

OpenCode data is currently read from the local filesystem via /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/src/contract/opencode/adapter.ts. API routes live under /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/src/app/api and are responsible for validating inputs with Zod schemas from /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/src/contract/pm/schemas.ts.

The OpenCode server model to implement is: a single OpenCode server base URL for MVP, multiple OpenCode projects (each corresponding to a directory) can map to a single OpenKanban project, and sessions are linked to issues only when the session’s OpenCode project belongs to the issue’s OpenKanban project. OpenCode projects themselves are not hierarchical; hierarchy is inferred from directory paths (a parent directory contains a child directory).

## Plan of Work

Milestone 1 is to establish a clean baseline and fix all previously discovered quality issues. This includes resolving the README doc links or creating the missing docs, aligning session link types with API responses, fixing unstable list keys, removing or deferring label filtering, correcting Zod trimming logic, fixing board API response types, migrating logging to a structured logger, cleaning invalid tsconfig fields, correcting lint/format scripts, and wrapping file I/O in try/catch. These fixes are independent of the OpenCode mapping work and should be done first to prevent compounding errors and failing tests.

Milestone 2 introduces a global OpenCode server adapter. Add an environment variable (for example OPENCODE_BASE_URL) to /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/env.example.txt and read it in a new adapter that implements IOpenCodeRepository. The adapter should use fetch from server-side API routes to call the OpenCode server and return validated results via the existing Zod schemas. Keep the LocalOpenCodeAdapter as a fallback for development if the base URL is unset, but the default path should be the server. This milestone must use the discovered OpenCode web UI JSON endpoints (from HAR) instead of OpenAPI spec, since the spec is not exposed.
Use these confirmed endpoints and shapes:
- GET /project -> OpenCodeProject[] where each entry has { id, worktree, vcs, sandboxes?, time, icon? }.
- GET /session?directory=<path>&roots=true&limit=<n> -> OpenCodeSession[] where each entry has { id, slug, version, projectID, directory, title, time, summary }.
- GET /session/{id}/message?directory=<path>&limit=<n> -> array of { info: { id, sessionID, role, time, summary?, agent?, model?, variant? }, parts: [{ id, sessionID, messageID, type, text? }] }.
The adapter must map the message response into the existing OpenCode message types by flattening info into the message object and attaching parts. Do not synthesize timestamps for parts; instead, update schemas/types so part time fields are optional.
For session search, the server does not expose a search parameter. Use limit=10 for default load, and when the user searches, increase limit (e.g., 200) and filter client-side by title/id/slug. If a project has more sessions than the limit, show a “refine search” message.

Milestone 3 implements project mapping storage and API. Add a new table to the SQLite schema to store mappings between OpenKanban project IDs and OpenCode project IDs. Use a unique constraint on opencodeProjectId to enforce that one OpenCode project belongs to only one OpenKanban project. Store the OpenCode directory string to allow hierarchy inference and for display. Expose API endpoints to list mappings for a given OpenKanban project, create a mapping, and remove a mapping. Validate these requests with Zod schemas. This milestone also includes a derived hierarchy computation: when returning OpenCode projects from the server to the UI, compute parent-child relations by choosing the nearest ancestor directory prefix among known projects. This should not be stored permanently; it should be computed from directory strings and returned in API responses.

Milestone 4 enforces session-link validation. When linking a session to an issue, determine the issue’s root OpenKanban project by traversing parentId until the type “project” is found. Then ensure that the session’s OpenCode project ID has been mapped to that OpenKanban project in the new mapping table. If the session belongs to a different OpenCode project not mapped to this OpenKanban project, reject the link with a clear error message. This protects the n:1 project mapping. Also generate the OpenCode session URL using the global base URL plus the path format {baseUrl}/{projectId}/session/{sessionId}. The UI must provide a direct “Open in OpenCode” link for each linked session.

Milestone 5 updates the UI to manage mappings and reflect the new data. Add a project settings tab for OpenKanban projects to link or unlink OpenCode projects. The UI should show OpenCode projects grouped by derived hierarchy (directory nesting) and indicate which ones are already mapped. The mapping UI must support multi-select with a single Add action and allow single adds. If an OpenCode project is already mapped to a different OpenKanban project, show a warning that names the existing project and prevent accidental remapping without an explicit user action. The session linking dialog should fetch sessions via server-side search and filter to those whose projectID is mapped to the issue’s project; when no query is provided, show a prompt to search instead of loading thousands of sessions.

Milestone 5 also adds a dedicated OpenKanban project page. Currently, the project route defaults to the last opened board. Implement a project overview page that lists all boards in the project as cards and shows project metadata, including the connected OpenCode projects and their directories. The project page must include a Settings tab where mapping is configured, and an Overview tab for boards and metadata. The project breadcrumb should point to this page rather than directly to a board.

Milestone 6 adds tests and validation. Add repository tests for project mapping constraints and for root project resolution. Add API route tests for mapping endpoints and session-link validation. Update any existing tests that relied on the previous session link shape or board API response types. Ensure build, lint, and tests pass.

## Concrete Steps

Run commands from /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban.

1) Install dependencies.
   Command: pnpm install
   Expected: node_modules created; no missing command errors.

2) Establish baseline.
   Commands:
     pnpm run build
     pnpm run lint
     pnpm test
   Expected: failures are recorded and then resolved by the plan; final baseline should pass.

3) Apply quality fixes, then re-run the same three commands. Keep short notes of failures and resolutions in this plan’s Surprises & Discoveries section.

4) For the OpenCode server adapter, use the confirmed JSON endpoints from the OpenCode web UI network calls (HAR). The OpenAPI JSON is not exposed at /doc or /openapi.json and those paths return HTML. The adapter must call /project, /session, and /session/{id}/message as described above.

5) Run the application:
   pnpm run dev
   Then open http://localhost:37291 and verify the mapping UI and session link validation behavior.

## Validation and Acceptance

Acceptance is met when a user can do all of the following without errors:

- Set OPENCODE_BASE_URL in .env and see the OpenCode project list load from the server.
- Map two OpenCode projects (directories) to a single OpenKanban project and see them persist in the UI.
- Link an OpenCode session to an issue only when that session’s project is mapped to the issue’s root OpenKanban project.
- Attempt to link a session from an unmapped OpenCode project and receive a clear error message.
- Click a direct “Open in OpenCode” link and open the OpenCode server at {baseUrl}/{projectId}/session/{sessionId}.
- Build and lint complete without errors.

Tests must pass via pnpm test, and any new tests introduced must fail before the change and pass after.

## Idempotence and Recovery

Schema changes should be additive and use CREATE TABLE IF NOT EXISTS so repeated runs do not fail. If a step fails mid-way, you can re-run the step after fixing the error without resetting the database. If a schema change needs to be reverted, document the exact SQL required to drop new tables and remove any related code paths before re-running tests.

## Artifacts and Notes

Keep short transcripts of important commands here once executed. For example:

  pnpm run build
  > openkanban@1.0.0 build
  > next build
  ... success ...

Also add small code excerpts only when they clarify critical behavior, such as the session URL construction or project mapping validation.

## Interfaces and Dependencies

The following interfaces and modules must exist at the end of the plan.

OpenCode server adapter:
- File: /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/src/contract/opencode/http-adapter.ts (new)
- Implements IOpenCodeRepository from /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/src/contract/opencode/repository.ts.
- Reads OPENCODE_BASE_URL and uses fetch to load projects, sessions, and messages.
- Uses GET /project, GET /session?directory=<path>&roots=true&limit=<n>, and GET /session/{id}/message?directory=<path>&limit=<n> from the OpenCode server.
- Transforms the message response from { info, parts } into the existing OpenCode message types and updates schemas so message parts can omit time fields.

Project mapping storage:
- Schema additions in /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/src/lib/db/schema.ts and /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/src/lib/db/connection.ts.
- New table name suggestion: project_sources.
- Columns: id (text primary key), kanbanProjectId (text, foreign key to issues.id), opencodeProjectId (text, unique), directory (text), createdAt (integer).
- Unique constraint on opencodeProjectId.

Repository additions:
- File: /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/src/lib/db/repository.ts.
- Methods: listProjectSources(kanbanProjectId: string): ProjectSource[]; linkProjectSource(kanbanProjectId: string, opencodeProjectId: string, directory: string): ProjectSource; unlinkProjectSource(kanbanProjectId: string, opencodeProjectId: string): void; getProjectSourceByOpenCodeProjectId(opencodeProjectId: string): ProjectSource | null; getProjectRootForIssue(issueId: string): Issue | null.

API routes:
- New routes under /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/src/app/api/projects/[id]/sources (GET, POST, DELETE) for mapping management.
- Update session-link route in /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/src/app/api/issues/[id]/sessions/route.ts to validate mapping before linking.
- Update OpenCode session routes to instantiate HttpOpenCodeAdapter when OPENCODE_BASE_URL is set.

Types and schemas:
- Add Zod schemas for project source mapping in /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/src/contract/pm/schemas.ts.
- Fix trim/min validation for issue and board names by using string.trim().min(1).
- Update SessionLink type in /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/src/features/sessions/types.ts to match API response.

UI changes:
- Add mapping UI under /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/src/features/projects or a new feature folder.
- Add a project settings tab UI under /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/src/features/projects or a new feature folder to manage OpenCode project mappings.
- Add a project overview page under /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/src/app/project/[projectId]/page.tsx (or a new sub-route) that lists boards and shows metadata including mapped OpenCode projects and directories.
- Update session link UI in /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/src/features/sessions and /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/src/features/kanban/components/task-infobar-actions.tsx to use stable keys, show direct OpenCode links, and search-filter sessions.

Logging:
- Replace /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/src/lib/logger.ts with a structured logger.
- Evaluate at least two options (Pino, Consola) and choose one. Document why in Decision Log before adding dependencies.

Documentation:
- Update /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/README.md to match available docs, or add the missing docs under /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/docs/.
- Update /Users/david.helmus/repos/ai-tooling/inspect-dashboards/opencode-session-manager/OpenKanban/env.example.txt to include OPENCODE_BASE_URL and explain the session URL format.

## Known Issues and Mitigations

This plan must remediate the following issues as part of Milestone 1. The fixes are required even if they are not directly related to OpenCode mapping.

- README links to missing docs. Either create the docs or update README links.
- SessionLink shape mismatches API. Align the type to the issue_sessions response and fix list keys.
- Unstable React keys for session links. Use composite keys.
- labelIds filter is ignored. Remove labelIds from filters or implement it later; for MVP remove or gate behind a feature flag.
- Whitespace-only titles pass validation. Use trim().min(1).
- Board API types claim issues in responses where they are not returned. Align client types with server responses or change server.
- Logger uses console and string formatting, violating structured logging standards. Migrate to structured logger.
- tsconfig.json contains invalid top-level moduleResolution. Remove or move into compilerOptions.
- lint:fix uses bun, format:check writes to disk. Standardize scripts.
- LocalOpenCodeAdapter has unguarded fs I/O. Wrap in try/catch.
- Project route currently defaults to the last opened board and lacks a project overview/settings page. Implement project overview and settings tabs to host mapping UI and metadata.

At the end of the plan, all of these issues must be closed or explicitly deferred with rationale documented in the Decision Log.

---

Plan Revision Notes

- 2026-02-06: Initial creation capturing architecture changes and remediation plan for known issues.
