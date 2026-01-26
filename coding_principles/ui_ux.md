# UI/UX & Interaction Standards (2026)

> **Mandate:** Accessible, Responsive, and "Vercel-Grade" Polish.

## 1. Interactions & Input
- **Keyboard:** All flows MUST be keyboard operable (Tab/Enter/Space).
- **Focus:** Visible `:focus-visible` ring is mandatory. Never `outline: none`.
- **Forms:**
  - **Enter Submits:** Text inputs must submit on Enter.
  - **No Dead Ends:** Error states must offer a "Try Again" or "Back" action.
  - **Inputs:** Font size ≥ 16px on mobile (prevents iOS auto-zoom).
  - **Copy/Paste:** NEVER block paste in inputs.

## 2. Loading & Feedback
- **Optimistic UI:** Update the UI *immediately* on click, reconcile later.
- **Skeletons:** Use skeletons (matching content shape) for initial load. No layout shifts.
- **Buttons:** Show a spinner/loading state while async work is pending. Disable double-submit.
- **Toasts:** Use "Polite" toasts for success/error messages.

## 3. Accessibility (a11y)
- **Semantic HTML:** `<button>` not `<div>`. `<nav>` not `<div>`.
- **Labels:** Icons MUST have `aria-label`. Inputs MUST have `<label>`.
- **Contrast:** Text must meet WCAG AA (4.5:1).
- **Motion:** Respect `prefers-reduced-motion`. Don't auto-play videos/animations.

## 4. Mobile & Responsive
- **Touch Targets:** Minimum 44x44px for tappable areas.
- **Safe Areas:** Respect standard device insets (`env(safe-area-inset-bottom)`).
- **Scroll:** Persist scroll position on Back/Forward navigation.

## 5. Design Tokens (Tailwind)
- **Colors:** Use semantic names (`text-error`, `bg-surface`) not hex codes (`#ff0000`).
- **Spacing:** Use standard scale (`p-4`, `m-2`) not arbitrary pixels (`p-[13px]`).
