# Kanban Project Base Options

> **Date:** 2026-01-24
> **Goal:** Select a lightweight, TypeScript-based Kanban board to visualize OpenCode sessions.

---

## Option 1: The "Clean Slate" Base (Standalone)

**Repository:** `Georgegriff/react-dnd-kit-tailwind-shadcn-ui`
**Best for:** Embedding into existing apps or absolute minimal maintenance.

### Technical Profile
- **Framework:** React (Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn UI
- **State:** Local React State (useState/Context)
- **Drag & Drop:** `@dnd-kit/core`

### Pros
- **Zero Bloat:** Contains *only* the Kanban board logic. No router, no auth, no extra pages.
- **Easy Understanding:** The entire logic fits in 3-4 files. Perfect for an AI agent to "hold in head".
- **Portable:** Can be dropped into Next.js, Remix, or generic React apps easily.

### Cons
- **No "Shell":** You have to build your own Sidebar, Header, Theme Toggle, and Layout.
- **Vite-based:** If we want Server Side Rendering (SSR) features later, we'd have to migrate it to Next.js manually.

---

## Option 2: The "Batteries Included" Base (Dashboard Starter)

**Repository:** `Kiranism/next-shadcn-dashboard-starter`
**Best for:** Rapidly launching a full-featured standalone application.

### Technical Profile
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn UI
- **State:** Zustand (Global State) + React Hook Form
- **Drag & Drop:** `@dnd-kit/core`

### Pros
- **Complete UI Shell:** Comes with a professional Sidebar, Header, User Nav, and Theme Switcher.
- **Modern Stack:** Uses Next.js App Router, which aligns with Vercel/modern React standards.
- **State Management:** `Zustand` is already set up, making it cleaner to inject our `OpenCode SDK` data loader than raw Context API.
- **Visuals:** Highly polished, enterprise-ready look out of the box.

### Cons
- **Boilerplate:** Includes Auth (Clerk/NextAuth), form examples, and dashboard widgets we don't need immediately.
- **Cleanup Required:** We must delete ~10 demo pages (`/employee`, `/profile`, `/auth`) to simplify it.

---

## Recommendation: Proceed with Option 2

We will start with **Option 2** because having a "real application" structure (Sidebar/Layout) allows us to easily expand later (e.g., adding a "Settings" page or "Project" selector) without rebuilding the UI frame.

### Plan
1.  Clone `Kiranism/next-shadcn-dashboard-starter`.
2.  **Strip:** Remove Auth, Dashboard Widgets, and unrelated Employee/Profile tables.
3.  **Keep:** The `DashboardLayout`, `Kanban` view, and `ThemeToggle`.
4.  **Inject:** Connect our `OpenCode SDK` loader to the Kanban view.
