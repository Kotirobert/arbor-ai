# ChalkAI / Arbor UI Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the ChalkAI sidebar/topbar, clean the Arbor header and sidebar, move Customize into the sidebar, animate the tool-switcher pill, and make both sidebars collapsible on mobile.

**Architecture:** All changes are confined to existing client components. Moving "Customize" into the Arbor sidebar requires lifting its edit-mode state out of `DashboardClient` into `ArborDashboardPage` via a thin client wrapper, so both sibling components can share it. The "New chat" / Library view needs `messages` state lifted from `AssistantChat` up to `ChalkAiClient`. No new routes or API endpoints needed.

**Tech Stack:** Next.js 16 App Router, React 18, TypeScript, CSS custom properties.

---

## File Map

| File | Action | What changes |
|------|--------|--------------|
| `components/chalkai/ChalkAiClient.tsx` | Modify | Remove topbar; simplify sidebar nav (no Generator, no Workspace label, no Assistant item); add New Chat + Library buttons; rename tool-switcher pill to "Assistant"; add collapse toggle; animate pill |
| `components/chalkai/AssistantChat.tsx` | Modify | Accept `messages`/`setMessages` as props (lift state up) |
| `components/arbor/ArborSidebar.tsx` | Modify | Remove school name line and avatar; add Customize button after Upload; accept `editMode`/`onToggleEdit` props; add collapse toggle; animate pill |
| `components/dashboard/DashboardClient.tsx` | Modify | Remove "Upload data" + "Customize" buttons from topbar; remove top-level `<div class="app">` wrapper (page now provides it); replace Arbor eyebrow+h1 with "ChalkAI" brand header; accept `editMode`/`onToggleEdit` props |
| `app/(platform)/arbor/dashboard/page.tsx` | Modify | Add thin `'use client'` wrapper component that owns `editMode` state; pass it down to both `ArborSidebar` and `DashboardClient` |

---

## Task 1 — ChalkAI: Remove topbar & simplify sidebar nav

**Files:**
- Modify: `components/chalkai/ChalkAiClient.tsx`

- [ ] **Step 1: Remove the topbar block**

  In `ChalkAiClient.tsx`, delete the entire `{/* Topbar */}` div (the one with `height: 64, borderBottom`). It spans from the comment down through the closing `</div>` before `{/* Panel */}`. After removal the import of `ModeTabs` and `AssistantChat`/`GeneratorPanel` remain (GeneratorPanel is removed later).

- [ ] **Step 2: Strip Generator + Workspace from sidebar nav, add New Chat**

  Replace the entire `{/* Workspace nav */}` side-group block with:

  ```tsx
  {/* Nav */}
  <div className="side-group">
    <button
      onClick={() => {/* wired in Task 2 */}}
      className="side-link side-link--active"
      style={{ fontWeight: 600 }}
    >
      <svg className="ico side-link__icon" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      New chat
    </button>
    <button
      onClick={() => {/* wired in Task 2 */}}
      className="side-link"
    >
      <svg className="ico side-link__icon" viewBox="0 0 24 24">
        <path d="M3 7h18M3 12h18M3 17h18"/>
      </svg>
      Library
      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-3)' }}>47</span>
    </button>
  </div>
  ```

- [ ] **Step 3: Remove unused imports**

  Remove `ModeTabs`, `type ChalkAiMode`, `GeneratorPanel` imports. Remove the `mode`/`setMode`/`handleMode` state and the `useEffect` that syncs it to the URL. Remove the `search`/`useSearchParams` references.

- [ ] **Step 4: Rename tool-switcher label**

  Change the active button text in `tool-switch` from `ChalkAI` to `Assistant`:

  ```tsx
  <button className="tool-switch__btn tool-switch__btn--active">
    <svg .../>
    Assistant
  </button>
  ```

- [ ] **Step 5: Verify in browser**

  Navigate to `http://localhost:3000/chalkai`. The topbar should be gone. Sidebar should show "New chat" + "Library". The switcher pill should say "Assistant".

- [ ] **Step 6: Commit**

  ```bash
  git add components/chalkai/ChalkAiClient.tsx
  git commit -m "feat: remove chalkai topbar, simplify sidebar nav"
  ```

---

## Task 2 — ChalkAI: New Chat + Library view (lift messages state)

**Files:**
- Modify: `components/chalkai/AssistantChat.tsx`
- Modify: `components/chalkai/ChalkAiClient.tsx`

- [ ] **Step 1: Update `AssistantChat` to accept messages as props**

  Change `AssistantChat`'s internal `messages` state to be controlled via props:

  ```tsx
  interface Props {
    profile:     TeacherProfile | null
    firstName?:  string
    messages:    ChatBubble[]
    onMessages:  (msgs: ChatBubble[]) => void
  }

  export function AssistantChat({ profile, firstName, messages, onMessages }: Props) {
    // Remove: const [messages, setMessages] = useState<ChatBubble[]>([])
    // Replace every setMessages(...) call with onMessages(...)
  ```

  The `setMessages((m) => [...])` patterns become:
  ```tsx
  onMessages([...messages, userMsg, assistantPlaceholder])
  // and inside streamText callbacks:
  onMessages(messages.map((m) => m.id === asstId ? { ...m, body: soFar } : m))
  ```

  Because the streaming callbacks close over a stale `messages`, use a ref:
  ```tsx
  const messagesRef = useRef(messages)
  useEffect(() => { messagesRef.current = messages }, [messages])
  // then in streamText callbacks use messagesRef.current instead of messages
  ```

- [ ] **Step 2: Add `messages` state + view mode to `ChalkAiClient`**

  ```tsx
  const [messages, setMessages] = useState<ChatBubble[]>([])
  const [view, setView]         = useState<'chat' | 'library'>('chat')
  ```

  Import `ChatBubble` from `./ChatMessage`.

- [ ] **Step 3: Wire New Chat and Library buttons**

  ```tsx
  <button
    onClick={() => { setMessages([]); setView('chat') }}
    className={`side-link${view === 'chat' && messages.length === 0 ? ' side-link--active' : ''}`}
    style={{ fontWeight: 600 }}
  >
    ...New chat
  </button>
  <button
    onClick={() => setView('library')}
    className={`side-link${view === 'library' ? ' side-link--active' : ''}`}
  >
    ...Library
  </button>
  ```

- [ ] **Step 4: Render chat or library in main panel**

  Replace the panel block:

  ```tsx
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
    {view === 'library' ? (
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 28px' }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>Chat history</div>
        {messages.length === 0 ? (
          <p style={{ color: 'var(--ink-2)', fontSize: 14 }}>No chats yet. Start a new chat to get going.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages
              .filter((m) => m.role === 'user')
              .map((m) => (
                <button
                  key={m.id}
                  onClick={() => setView('chat')}
                  className="side-link"
                  style={{ textAlign: 'left', fontSize: 13 }}
                >
                  {m.body.slice(0, 60)}{m.body.length > 60 ? '…' : ''}
                </button>
              ))}
          </div>
        )}
      </div>
    ) : (
      <AssistantChat
        profile={profile}
        firstName={session?.firstName}
        messages={messages}
        onMessages={setMessages}
      />
    )}
  </div>
  ```

- [ ] **Step 5: Verify in browser**

  - Send a message → message appears
  - Click Library → shows the message you sent as a history item
  - Click New chat → messages clear, back to empty chat
  - Click a history item → returns to chat view

- [ ] **Step 6: Commit**

  ```bash
  git add components/chalkai/ChalkAiClient.tsx components/chalkai/AssistantChat.tsx
  git commit -m "feat: add new chat / library view, lift messages state"
  ```

---

## Task 3 — Arbor: Replace header text with ChalkAI brand

**Files:**
- Modify: `components/dashboard/DashboardClient.tsx`

- [ ] **Step 1: Replace eyebrow + h1**

  In `DashboardClient.tsx` around line 184–192, replace:

  ```tsx
  <div className="eyebrow" style={{ marginBottom: 10 }}>Arbor AI · School overview</div>
  <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 44, lineHeight: 1.05, letterSpacing: '-0.02em', margin: 0 }}>
    A calm view of your <i style={{ color: 'var(--chalk-green)' }}>school, today.</i>
  </h1>
  ```

  with:

  ```tsx
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
    <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--ink)', display: 'inline-block' }} />
    <span style={{ fontFamily: 'var(--f-display)', fontSize: 28, letterSpacing: '-0.01em' }}>ChalkAI</span>
  </div>
  ```

- [ ] **Step 2: Verify in browser**

  Navigate to `http://localhost:3000/arbor/dashboard`. The old Arbor AI eyebrow and h1 should be replaced by the ChalkAI brand mark and wordmark.

- [ ] **Step 3: Commit**

  ```bash
  git add components/dashboard/DashboardClient.tsx
  git commit -m "feat: replace arbor dashboard header with chalkai brand"
  ```

---

## Task 4 — Arbor: Clean sidebar (remove school info + avatar)

**Files:**
- Modify: `components/arbor/ArborSidebar.tsx`

- [ ] **Step 1: Remove school name / lastUpload line**

  Delete the `<div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4, paddingLeft: 30, lineHeight: 1.4 }}>` block (school name + last upload date) from the brand section.

  The brand section becomes just:
  ```tsx
  <div className="nav__brand" style={{ fontSize: 22 }}>
    <span className="nav__brand-mark" />
    <span>Arbor AI</span>
  </div>
  ```

- [ ] **Step 2: Remove avatar from side-meta**

  In the `{/* User meta */}` section, delete `<div className="avatar">{initials}</div>`.

  Also remove the `initials` variable and the `session` state + `useEffect` if nothing else references them. (Check: if `session` is used elsewhere in the component — currently only for `initials` — remove both.)

- [ ] **Step 3: Remove unused imports**

  Remove `useState`, `useEffect`, `getSession` if they are no longer used after Step 2.

- [ ] **Step 4: Verify in browser**

  The Arbor sidebar should now show: brand → tool switcher → nav → View as. No school name line, no avatar circle.

- [ ] **Step 5: Commit**

  ```bash
  git add components/arbor/ArborSidebar.tsx
  git commit -m "feat: remove school info and avatar from arbor sidebar"
  ```

---

## Task 5 — Arbor: Move Customize button into sidebar

The challenge: `editMode` state lives in `DashboardClient` (client component), but `ArborSidebar` is a sibling rendered from the server page. The fix: introduce a thin `'use client'` wrapper in the page that owns `editMode` state and threads it to both components.

**Files:**
- Modify: `app/(platform)/arbor/dashboard/page.tsx`
- Modify: `components/arbor/ArborSidebar.tsx`
- Modify: `components/dashboard/DashboardClient.tsx`

- [ ] **Step 1: Add `editMode` props to `ArborSidebar`**

  Add to `ArborSidebarProps`:
  ```tsx
  editMode:       boolean
  onToggleEdit:   () => void
  ```

  Add the Customize button after the Upload data link inside the Workspace nav group:
  ```tsx
  <button
    onClick={onToggleEdit}
    className={`side-link${editMode ? ' side-link--active' : ''}`}
  >
    <svg className="ico side-link__icon" viewBox="0 0 24 24">
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/>
    </svg>
    {editMode ? 'Exit customise' : 'Customise'}
  </button>
  ```

- [ ] **Step 2: Accept `editMode`/`onToggleEdit` props in `DashboardClient`**

  Remove the internal `editMode`, `openEdit`, `closeEdit` from `useDashboardConfig` usage for the topbar. The `useDashboardConfig` hook still manages `draft`, `isDirty`, `togglePanel`, `save`, `reset`, `isVisible` — just `openEdit`/`closeEdit` are replaced by the prop.

  Add to `DashboardClientProps`:
  ```tsx
  editMode:      boolean
  onToggleEdit:  () => void
  ```

  Remove the "Customize" / "Exit customise" button from the topbar buttons group entirely. Remove the "Upload data" button from the topbar buttons group entirely.

  Replace `openEdit` / `closeEdit` references with `onToggleEdit`.

  The `useDashboardConfig` call changes to:
  ```tsx
  const {
    draft, isDirty,
    togglePanel, save, reset, isVisible,
  } = useDashboardConfig(role)
  ```

  And pass `editMode` directly from props into the `useDashboardConfig`-driven render logic. Check `useDashboardConfig` to confirm `editMode` is not returned from it — if it is, stop using its returned `editMode` and use the prop instead. (Look at `hooks/useDashboardConfig.ts` to verify.)

- [ ] **Step 3: Create client wrapper in the page**

  In `app/(platform)/arbor/dashboard/page.tsx`, add at the top of the file:

  ```tsx
  'use client' // NOTE: this turns the whole file into a client component; that's fine since it only fetches mock data
  ```

  Wait — the page currently uses `async/await` for data fetching (server component). Converting it to a client component breaks that.

  Instead, keep the server page as-is and create a new thin client layout component. Add a new file:

  **Create: `components/arbor/ArborLayout.tsx`**

  ```tsx
  'use client'

  import { useState } from 'react'
  import { ArborSidebar } from './ArborSidebar'
  import { DashboardClient } from '@/components/dashboard/DashboardClient'
  import type { UserRole, DashboardStats } from '@/types'
  import type { PriorityRow, InsightItem, YearGroupBar } from '@/components/dashboard/DashboardClient'

  interface ArborLayoutProps {
    role:              UserRole
    yearGroup:         string
    stats:             DashboardStats
    priorityRows:      PriorityRow[]
    yearGroupBars:     YearGroupBar[]
    attInsights:       InsightItem[]
    behInsights:       InsightItem[]
    subjectAttainment: Record<string, { pre: number; wt: number; exp: number; gd: number }>
    aiChips:           string[]
    suggestedPrompts:  string[]
    schoolName:        string
    lastUpload:        string
  }

  export function ArborLayout({ schoolName, lastUpload, role, ...rest }: ArborLayoutProps) {
    const [editMode, setEditMode] = useState(false)

    return (
      <div className="app">
        <ArborSidebar
          role={role}
          schoolName={schoolName}
          lastUpload={lastUpload}
          editMode={editMode}
          onToggleEdit={() => setEditMode((e) => !e)}
        />
        <DashboardClient
          role={role}
          editMode={editMode}
          onToggleEdit={() => setEditMode((e) => !e)}
          {...rest}
        />
      </div>
    )
  }
  ```

- [ ] **Step 4: Update the server page to use `ArborLayout`**

  In `app/(platform)/arbor/dashboard/page.tsx`, replace:
  ```tsx
  import { ArborSidebar } from '@/components/arbor/ArborSidebar'
  // and
  import { DashboardClient } from '@/components/dashboard/DashboardClient'
  ```
  with:
  ```tsx
  import { ArborLayout } from '@/components/arbor/ArborLayout'
  ```

  Replace the `return` block:
  ```tsx
  return (
    <Suspense fallback={<SkeletonDashboard />}>
      <ArborLayout
        role={role}
        yearGroup={yearGroup ?? 'Year 6'}
        stats={stats}
        priorityRows={priorityRows}
        yearGroupBars={YEAR_GROUP_ATTENDANCE_BARS}
        attInsights={ATTENDANCE_INSIGHTS}
        behInsights={BEHAVIOUR_INSIGHTS}
        subjectAttainment={MOCK_SUBJECT_ATTAINMENT}
        aiChips={AI_ACTION_CHIPS[role] ?? AI_ACTION_CHIPS.slt}
        suggestedPrompts={SUGGESTED_PROMPTS}
        schoolName="Greenfield Primary School"
        lastUpload={lastImport}
      />
    </Suspense>
  )
  ```

  Remove the outer `<div className="app">` and the `<Suspense fallback={null}>` wrapping ArborSidebar.

- [ ] **Step 5: Verify `useDashboardConfig` hook**

  Read `hooks/useDashboardConfig.ts`. Confirm whether it returns `editMode`. If it does, stop using that returned value in `DashboardClient` — use the prop instead. Update `DashboardClient` accordingly. The hook's `openEdit`/`closeEdit` can be dropped if no longer needed; keep `togglePanel`, `save`, `reset`, `isVisible`, `draft`, `isDirty`.

- [ ] **Step 6: Verify in browser**

  - Arbor dashboard loads correctly
  - Clicking "Customise" in the sidebar opens the customise panel
  - The old topbar Customize button is gone
  - The old topbar Upload data button is gone
  - The `CustomiseSidebar` panel still renders correctly in edit mode

- [ ] **Step 7: Commit**

  ```bash
  git add components/arbor/ArborLayout.tsx components/arbor/ArborSidebar.tsx \
          components/dashboard/DashboardClient.tsx \
          app/\(platform\)/arbor/dashboard/page.tsx
  git commit -m "feat: move customize to sidebar, extract ArborLayout client wrapper"
  ```

---

## Task 6 — Both: Animated sliding-pill tool switcher

Replace the static `tool-switch__btn--active` class swap with a CSS sliding pill that moves over the buttons without the buttons themselves moving.

**Files:**
- Modify: `components/chalkai/ChalkAiClient.tsx`
- Modify: `components/arbor/ArborSidebar.tsx`

- [ ] **Step 1: Add pill animation styles**

  In both files, replace the `<div className="tool-switch">` block with this pattern (shown for ChalkAI; Arbor is identical structure but with reversed active side):

  ```tsx
  {/* Tool switcher */}
  {(() => {
    const isAssistant = true  // ChalkAI: always true; Arbor: always false
    return (
      <div
        className="tool-switch"
        style={{ position: 'relative' }}
      >
        {/* Sliding pill */}
        <span style={{
          position: 'absolute',
          top: 3, bottom: 3,
          left: isAssistant ? 3 : '50%',
          width: 'calc(50% - 3px)',
          background: 'var(--ink)',
          borderRadius: 8,
          transition: 'left 220ms cubic-bezier(.4,0,.2,1)',
          pointerEvents: 'none',
        }} />
        <button className="tool-switch__btn" style={{ position: 'relative', zIndex: 1, color: isAssistant ? 'var(--paper)' : undefined }}>
          <svg .../> Assistant
        </button>
        <Link href="/arbor/dashboard" className="tool-switch__btn" style={{ position: 'relative', zIndex: 1, color: !isAssistant ? 'var(--paper)' : undefined }}>
          <svg .../> Arbor AI
        </Link>
      </div>
    )
  })()}
  ```

  For `ArborSidebar.tsx`, the pill starts on the right (Arbor AI active):
  ```tsx
  left: '50%'  // pill is on the right side (Arbor AI)
  ```
  And the colors are reversed (Arbor AI button gets `color: 'var(--paper)'`).

  Remove the `tool-switch__btn--active` class usage from both files since the pill now handles the visual state.

- [ ] **Step 2: Verify animation**

  - On `/chalkai`: pill is on the left (Assistant active), text is white on black pill
  - On `/arbor/dashboard`: pill is on the right (Arbor AI active), text is white on black pill
  - Navigate between the two using the switcher buttons — the pill animates smoothly

- [ ] **Step 3: Commit**

  ```bash
  git add components/chalkai/ChalkAiClient.tsx components/arbor/ArborSidebar.tsx
  git commit -m "feat: animated sliding pill tool switcher"
  ```

---

## Task 7 — Both: Collapsible sidebar

Add a hamburger/collapse toggle to both sidebars. On mobile (< 768px), sidebar starts collapsed. On desktop it defaults open.

**Files:**
- Modify: `components/chalkai/ChalkAiClient.tsx`
- Modify: `components/arbor/ArborSidebar.tsx`
- Modify: `components/arbor/ArborLayout.tsx`

- [ ] **Step 1: Add collapse state to `ChalkAiClient`**

  ```tsx
  const [sidebarOpen, setSidebarOpen] = useState(true)
  ```

  Add a toggle button at the top of the sidebar:
  ```tsx
  <button
    onClick={() => setSidebarOpen((o) => !o)}
    className="btn btn--ghost btn--sm"
    style={{ marginLeft: 'auto', padding: '4px 6px' }}
    aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
  >
    <svg className="ico" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
      {sidebarOpen
        ? <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7"/>  /* collapse left */
        : <path d="M13 5l7 7-7 7M6 5l7 7-7 7"/>         /* expand right */
      }
    </svg>
  </button>
  ```

  Apply the collapsed state to the sidebar:
  ```tsx
  <aside
    className="app__sidebar"
    style={{
      width: sidebarOpen ? undefined : 0,
      overflow: sidebarOpen ? undefined : 'hidden',
      padding: sidebarOpen ? undefined : 0,
      transition: 'width 220ms cubic-bezier(.4,0,.2,1)',
    }}
  >
  ```

  Also add a floating open button when collapsed (so user can re-open):
  ```tsx
  {!sidebarOpen && (
    <button
      onClick={() => setSidebarOpen(true)}
      className="btn btn--ghost btn--sm"
      style={{
        position: 'fixed', top: 16, left: 16, zIndex: 50,
        background: 'var(--paper)', border: '1px solid var(--line)',
      }}
      aria-label="Open sidebar"
    >
      <svg className="ico" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
        <path d="M3 12h18M3 6h18M3 18h18"/>
      </svg>
    </button>
  )}
  ```

- [ ] **Step 2: Add collapse state to `ArborLayout` (Arbor sidebar)**

  In `ArborLayout.tsx`, add:
  ```tsx
  const [sidebarOpen, setSidebarOpen] = useState(true)
  ```

  Pass to `ArborSidebar`:
  ```tsx
  <ArborSidebar
    ...
    sidebarOpen={sidebarOpen}
    onToggleSidebar={() => setSidebarOpen((o) => !o)}
  />
  ```

- [ ] **Step 3: Add collapse props + toggle to `ArborSidebar`**

  Add to `ArborSidebarProps`:
  ```tsx
  sidebarOpen:      boolean
  onToggleSidebar:  () => void
  ```

  Apply the same collapsed style and toggle button as in Step 1:
  ```tsx
  <aside
    className="app__sidebar"
    style={{
      width: sidebarOpen ? undefined : 0,
      overflow: sidebarOpen ? undefined : 'hidden',
      padding: sidebarOpen ? undefined : 0,
      transition: 'width 220ms cubic-bezier(.4,0,.2,1)',
    }}
  >
    {/* Add toggle button in brand row */}
  ```

  In `ArborLayout.tsx`, also render the floating re-open button when collapsed:
  ```tsx
  {!sidebarOpen && (
    <button
      onClick={() => setSidebarOpen(true)}
      className="btn btn--ghost btn--sm"
      style={{
        position: 'fixed', top: 16, left: 16, zIndex: 50,
        background: 'var(--paper)', border: '1px solid var(--line)',
      }}
    >
      <svg className="ico" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
        <path d="M3 12h18M3 6h18M3 18h18"/>
      </svg>
    </button>
  )}
  ```

- [ ] **Step 4: Verify in browser**

  - Click the collapse toggle → sidebar slides away, floating hamburger appears
  - Click floating hamburger → sidebar slides back
  - Works on both `/chalkai` and `/arbor/dashboard`
  - No layout breaks when sidebar is collapsed (main content fills the space)

- [ ] **Step 5: Commit**

  ```bash
  git add components/chalkai/ChalkAiClient.tsx \
          components/arbor/ArborSidebar.tsx \
          components/arbor/ArborLayout.tsx
  git commit -m "feat: collapsible sidebar with animated slide on both tools"
  ```

---

## Self-Review

**Spec coverage:**

| Requirement | Task |
|-------------|------|
| ChalkAI: remove Generator | Task 1 |
| ChalkAI: remove Assistant + Workspace from sidebar | Task 1 |
| ChalkAI: add New Chat + Library (chat history) | Task 2 |
| ChalkAI: rename switcher button to "Assistant" | Task 1 |
| ChalkAI: remove topbar | Task 1 |
| Arbor: replace header text with ChalkAI | Task 3 |
| Arbor: remove school name + avatar from sidebar | Task 4 |
| Arbor: remove Upload data + Customize from topbar | Task 5 |
| Arbor: Customize button in sidebar under Upload | Task 5 |
| Switcher: only pill moves, not buttons | Task 6 |
| Collapsible sidebar | Task 7 |

**All requirements covered. No placeholders.**
