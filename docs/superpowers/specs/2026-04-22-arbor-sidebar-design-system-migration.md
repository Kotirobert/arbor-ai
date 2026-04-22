# Arbor Sidebar + Design System Migration

**Date:** 2026-04-22  
**Status:** Approved  
**Scope:** Arbor tool — sidebar shell, three page migrations, removal of ArborToolbar

---

## Goal

Give the Arbor tool the same sidebar treatment ChalkAI has, and migrate all remaining Arbor pages from old Tailwind utility classes to the project's CSS token design system. After this work, every page in the platform will use the same visual language.

The existing `ArborToolbar` creates an extra top bar that ChalkAI doesn't have. This causes a visible layout jump when navigating between the two tools. Removing it entirely (and moving its content into the sidebar) eliminates the jump.

---

## What's changing

### 1. New component — `ArborSidebar`

**File:** `components/arbor/ArborSidebar.tsx`

A client component that renders the left sidebar for all Arbor pages. Mirrors the sidebar built into `ChalkAiClient` but is a standalone component so Arbor and ChalkAI remain independent.

Structure (top → bottom):
- **Brand** — `nav__brand` class, green mark, "Arbor AI" in Instrument Serif
- **Tool switcher** — `tool-switch` / `tool-switch__btn` classes. Arbor button is `tool-switch__btn--active`; ChalkAI button is a `<Link href="/chalkai">` 
- **Workspace nav group** — `side-group` with two `side-link` items:
  - Dashboard → `/arbor/dashboard`
  - Upload data → `/arbor/upload`
  - Active state determined by current pathname (`usePathname`)
- **View as (role selector)** — small `side-group` below Workspace, contains a native `<select>` styled with CSS tokens (`--paper`, `--line-2`, `--ink`). Reads `role` from URL search params and pushes `?role=` on change. This replaces the old `ArborToolbar` role selector.
- **User meta** — `side-meta` / `avatar` classes at the bottom, reads session from `mockSession`

The school name and last-import date (previously shown in `ArborToolbar`) move into the sidebar itself — displayed as small secondary text below the brand mark, e.g.:

```
● Arbor AI
  Greenfield Primary  ·  22 Apr
```

This keeps that context visible without adding any extra bar above the main content area.

Props:
```ts
interface ArborSidebarProps {
  role:       UserRole
  schoolName: string
  lastUpload: string   // displayed in sidebar below brand
}
```

`ArborSidebar` does not own the `.app` shell — pages do (see below).

---

### 2. Updated — `app/(platform)/arbor/dashboard/page.tsx`

- Wrap output in `<div className="app">` shell
- Render `<ArborSidebar>` as the `<aside>` (replacing `<ArborToolbar>`)
- Keep `<DashboardClient>` in `<main className="app__main">`
- Pass `role`, `schoolName`, `lastUpload` to `ArborSidebar`
- Remove `ArborToolbar` import

No extra top bar is added above `DashboardClient` — the school name and last-import info live in the sidebar. `DashboardClient`'s existing internal topbar (breadcrumb + mode tabs) stays as-is.

---

### 3. Updated — `app/(platform)/arbor/upload/page.tsx`

- Wrap in `<div className="app">` + `<ArborSidebar role="slt" ...>`  
  *(Upload page has no role concept — pass a neutral default; role selector in sidebar is still visible for navigation consistency)*
- The upload drop-zone card: replace every Tailwind class with CSS token equivalents:
  - `bg-stone-50` → `background: var(--paper-2)`
  - `bg-white` → `background: var(--paper)`
  - `border-stone-200` → `border: 1px solid var(--line)`
  - `bg-brand-500` / `hover:bg-brand-600` (upload button) → `background: var(--chalk-green)`
  - `text-stone-900` → `color: var(--ink)`
  - `text-stone-500` / `text-stone-400` → `color: var(--ink-2)` / `color: var(--ink-3)`
  - `border-brand-300 bg-brand-50` (drag hover) → `border-color: var(--chalk-green-line); background: var(--chalk-green-soft)`
  - `text-brand-700` → `color: var(--chalk-green)`
  - `border-red-200 bg-red-50 text-red-700` → `border-color: var(--amber-line); background: var(--amber-soft); color: var(--amber)` for warnings; `border-color: ...` for errors use `--red` / `--red-soft`
  - Step progress `border-brand-400 border-t-transparent` spinner → CSS token equivalent
  - `StatBox` component: replace `text-2xl font-semibold` with `font-family: var(--f-display); font-size: 28px; font-style: italic`
- Remove `cn()` calls that are only needed for Tailwind class composition; replace with inline styles or simple class strings

---

### 4. Updated — `app/(platform)/arbor/pupil/[id]/page.tsx`

- Wrap in `<div className="app">` + `<ArborSidebar role={role} ...>`  
  *(Role not available on this page — pass `"teacher"` as neutral default; the sidebar's role selector is present but doesn't affect pupil detail content)*
- Replace the ad-hoc header (`bg-white border-stone-200`, back-link, upload-link) with the standard topbar pattern used by other pages — a `<div>` with `height: 56px; border-bottom: 1px solid var(--line); display: flex; align-items: center; padding: 0 24px` and a breadcrumb showing "Arbor AI / Dashboard / [Pupil Name]"
- Remove the standalone "Upload new data" link from this header (it's now in the sidebar)

---

### 5. Deleted — `ArborToolbar` (or left unused)

`components/arbor/ArborToolbar.tsx` will no longer be imported anywhere and must be deleted. The role-selector moves to `ArborSidebar`. The school name and last-upload date display in the sidebar below the brand. No replacement top bar is added — this is intentional to eliminate the layout jump between tools.

---

### 6. Updated — `components/dashboard/DashboardClient.tsx`

The role selector chips / ROLE_STYLES map currently uses Tailwind (`bg-brand-50 text-brand-600`, `bg-amber-50 text-amber-700`, `bg-blue-50 text-blue-700`). Replace with CSS token classes:
- SLT → `background: var(--chalk-green-soft); color: var(--chalk-green); border: 1px solid var(--chalk-green-line)`
- HOY → `background: var(--amber-soft); color: var(--amber); border: 1px solid var(--amber-line)`
- Teacher → `background: var(--blue-soft); color: var(--blue); border: 1px solid var(--line-2)`

Any other `bg-brand-*`, `text-stone-*`, `border-stone-*` Tailwind references in DashboardClient → CSS token equivalents.

---

## What's NOT changing

- `ChalkAiClient.tsx` — no changes; its sidebar stays embedded as-is
- `app/(platform)/layout.tsx` — no changes
- `globals.css` — no new tokens needed; all required classes already exist
- `tailwind.config.ts` — no changes
- Marketing pages, auth pages — already on new design system
- API routes, data layer, mock data — untouched

---

## Component tree after changes

```
app/(platform)/arbor/dashboard/page.tsx
  └─ div.app
       ├─ ArborSidebar (new)
       └─ main.app__main
            └─ DashboardClient (updated: CSS tokens)

app/(platform)/arbor/upload/page.tsx
  └─ div.app
       ├─ ArborSidebar (new)
       └─ main.app__main
            └─ [upload UI: migrated to CSS tokens]

app/(platform)/arbor/pupil/[id]/page.tsx
  └─ div.app
       ├─ ArborSidebar (new)
       └─ main.app__main
            └─ [topbar breadcrumb + PupilDetailClient]
```

---

## Success criteria

- All three Arbor pages render the sidebar with correct active state per route
- Role selector in sidebar works (pushes `?role=` and re-renders dashboard)
- Zero Tailwind `bg-*`, `text-*`, `border-*` utility classes remain in the migrated files
- `ArborToolbar` is no longer imported anywhere
- `next build` passes with no errors
- Visual consistency: Arbor pages look like siblings of the ChalkAI page
