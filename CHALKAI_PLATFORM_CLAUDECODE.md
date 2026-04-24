# ChalkAI Platform — Claude Code Handoff Document

> Combined project spec for the unified ChalkAI platform: AI teaching tools + Arbor school data assistant.
> One Next.js app, one sign-in, two tools accessible from a shared dashboard.

---

## 1. Product Overview

**ChalkAI** is an AI-powered SaaS platform for UK primary and secondary schools.

### Two Tools Under One Roof

| Tool | Audience | Purpose |
|------|----------|---------|
| **ChalkAI** (teaching tools) | Teachers | Generates lesson plans, worksheets, quizzes, parent emails via AI. Conversational teaching assistant with pedagogical intelligence. |
| **Arbor AI** (school data assistant) | Headteachers, Year Leads, Class Teachers | Uploads Arbor MIS CSV exports, generates pastoral insights, flags at-risk pupils, answers natural language questions about school data. |

### Why one platform?
Teachers and school leaders are the same schools. A Year Lead uses Arbor AI to identify at-risk pupils, then uses ChalkAI to generate differentiated worksheets for those same pupils. One login, one subscription, both tools.

### Single Sign-in
One email + password login gives access to both tools. Role claims determine what's visible:
- `teacher` role → ChalkAI tools by default, can switch to Arbor AI
- `headteacher` / `hoy` role → Arbor AI by default, can access ChalkAI
- `admin` role → school admin dashboard (future)

---

## 2. Design System

### ChalkAI (dark theme — applies to all teaching tool screens)

```css
--bg:           #0e0f0d;
--surface:      #161714;
--surface2:     #1d1e1b;
--surface3:     #232420;
--border:       rgba(255,255,255,0.07);
--border2:      rgba(255,255,255,0.13);
--border3:      rgba(255,255,255,0.22);
--ink:          #f2efe8;
--ink2:         #a8a498;
--ink3:         #6b6860;
--amber:        #e8a32a;
--amber-dim:    rgba(232,163,42,0.09);
--amber-border: rgba(232,163,42,0.28);
--green:        #4a9e6b;
--green-dim:    rgba(74,158,107,0.09);
--green-border: rgba(74,158,107,0.28);
--blue:         #4a7fe8;
--blue-dim:     rgba(74,127,232,0.09);
```

### Arbor AI (light theme — applies to all pastoral data screens)

```css
/* Brand */
--brand-500:  #1B5E3B;
--brand-600:  #154D30;
--brand-50:   #E8F4ED;
--brand-200:  #A7D4B8;

/* Stone palette (Tailwind stone-*) */
--stone-50:   #FAFAF9;
--stone-100:  #F5F5F4;
--stone-200:  #E7E5E4;
--stone-400:  #A8A29E;
--stone-500:  #78716C;
--stone-900:  #1C1917;

/* Semantic */
--red-600:    #DC2626;
--amber-600:  #D97706;
--green-700:  #15803D;
```

### Typography (shared across both tools)

```
Display / headings:  Instrument Serif (Google Fonts) — italic for emphasis
UI labels / nav:     Syne (Google Fonts) — weight 700–800
Body / inputs:       DM Sans (Google Fonts) — weight 300–500
Monospace (Arbor):   DM Mono (Google Fonts) — audit log, code
```

### Noise texture (ChalkAI screens only — do not apply to Arbor AI)

```css
body::before {
  content: '';
  position: fixed; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none; z-index: 0; opacity: 0.5;
}
```

---

## 3. Tech Stack

### Recommended production stack

```
Frontend:   Next.js 14+ (App Router), TypeScript, Tailwind CSS
Auth:       NextAuth.js (email + password only — no SSO)
Database:   Supabase (Postgres) — user profiles, resources, conversations, school data
AI:         Anthropic Claude (ChalkAI) + OpenAI GPT-4o-mini (Arbor AI)
Payments:   Stripe (Free / Pro / School tiers)
Deployment: Vercel
```

### AI model assignments

| Feature | Model | Reason |
|---------|-------|--------|
| ChalkAI resource generation | `claude-sonnet-4-20250514` | Quality matters for lesson plans |
| ChalkAI assistant chat | `claude-sonnet-4-20250514` | Same — do not downgrade |
| Arbor AI chat queries | `gpt-4o-mini` | Cost-efficient for data analysis |
| Arbor AI pupil summaries | `gpt-4o-mini` | Structured JSON output, fast |

### Environment variables

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...   # ChalkAI resource generation + assistant
OPENAI_API_KEY=sk-...          # Arbor AI data queries + pupil summaries
OPENAI_MODEL=gpt-4o-mini       # Optional override

NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...

NEXT_PUBLIC_SCHOOL_NAME=       # Optional — shown in Arbor AI navbar
```

---

## 4. App Structure (unified Next.js project)

```
app/
  (auth)/
    sign-in/          ← Shared sign-in page (email + password)
    sign-up/          ← ChalkAI teacher signup + profile wizard
    forgot-password/
  (platform)/
    layout.tsx        ← Shared authenticated shell (nav, tool switcher)
    dashboard/        ← Landing page post-login (role-aware)

    # ── ChalkAI tool ──────────────────────────────
    chalkai/
      page.tsx        ← ChalkAI home / mode selector
      generator/
        page.tsx      ← Resource generator (all 4 types)
      assistant/
        page.tsx      ← AI teaching assistant chat
      history/
        page.tsx      ← Saved resources list
      resource/[id]/
        page.tsx      ← Single resource view + edit + export

    # ── Arbor AI tool ─────────────────────────────
    arbor/
      page.tsx        ← Arbor AI dashboard (redirects to /arbor/dashboard)
      upload/
        page.tsx      ← CSV upload flow
      dashboard/
        page.tsx      ← School overview dashboard
      pupil/[id]/
        page.tsx      ← Individual pupil detail + AI summary

    # ── Shared ────────────────────────────────────
    settings/
      page.tsx        ← Account, password, billing
    profile/
      page.tsx        ← Teacher profile edit (ChalkAI)
    admin/
      page.tsx        ← School admin dashboard (School plan only)

  api/
    # ChalkAI APIs
    generate/         ← POST: Anthropic resource generation
    chat/             ← POST: Anthropic assistant conversation
    resources/        ← GET/POST/DELETE: saved resources CRUD

    # Arbor AI APIs
    upload/           ← POST: CSV parse → return structured school data
    insights/         ← POST: OpenAI chat query with school context
    pupils/[id]/
      summary/        ← POST: OpenAI pupil pastoral summary

    # Shared APIs
    auth/[...nextauth]/ ← NextAuth handler
    stripe/webhook/   ← Stripe events

components/
  # ChalkAI components
  chalkai/
    GeneratorForm.tsx
    ResourceOutput.tsx
    AssistantChat.tsx
    RefinementBar.tsx

  # Arbor AI components
  arbor/
    dashboard/
      DashboardClient.tsx
      SummaryCards.tsx
      PriorityPanel.tsx
      InsightsPanel.tsx
      AiActionsPanel.tsx
      SubjectAttainmentPanel.tsx
      AuditLog.tsx
      CustomiseSidebar.tsx
    pupil/
      PupilDetailClient.tsx

  # Shared UI components
  ui/
    Button.tsx
    Card.tsx
    Badge.tsx
    Navbar.tsx        ← TOOL SWITCHER lives here
    Toast.tsx
    Skeleton.tsx
    Modal.tsx

lib/
  # ChalkAI
  prompts.ts          ← All prompt templates
  anthropic.ts        ← Anthropic SDK wrapper

  # Arbor AI
  csvParser.ts        ← CSV → ParsedSchoolData
  schoolStore.ts      ← sessionStorage persistence
  schoolContext.ts    ← Builds OpenAI context from school data
  ai.ts               ← OpenAI wrapper (chat + pupil summaries)
  dashboardConfig.ts  ← Per-role panel config (localStorage)

  # Shared
  utils.ts
  auth.ts             ← Session helpers

hooks/
  useDashboardConfig.ts
  useTeacherProfile.ts

types/
  index.ts            ← All domain types (both tools)
```

---

## 5. Authentication & Routing

### Sign-in flow (shared)

```
/sign-in
  ↓
POST /api/auth/sign-in (NextAuth credentials provider)
  ↓
  ├── role: teacher    → /chalkai
  ├── role: headteacher/hoy/slt → /arbor/dashboard
  └── role: admin      → /admin
```

### Sign-up flow (ChalkAI only — Arbor users are added by school admin)

```
/sign-up
  ↓  email + password
Profile Wizard (3 steps)
  ├── Step 1: Curriculum + school phase
  ├── Step 2: Year groups + class profile
  └── Step 3: Lesson length + output style
  ↓
/chalkai (dashboard)
```

### Tool switcher (in shared nav)

A pill/tab component in the top navbar lets authenticated users switch between tools:

```
[ ChalkAI ⚡ ]  [ Arbor AI 📊 ]
```

Switching navigates to `/chalkai` or `/arbor/dashboard` respectively.
The active tool is stored in `localStorage` as `last-active-tool` so returning users land on the right tool.

---

## 6. Shared Sign-in Page Spec

### Design
- Full-screen dark background using ChalkAI design system (`--bg: #0e0f0d`)
- Centred card with logo at top — "ChalkAI" wordmark in Instrument Serif
- Subtitle: "Teaching tools + school data. One login."
- Email + password fields (DM Sans)
- "Sign in" button (amber accent)
- "Forgot password?" link below button
- "Don't have an account? Sign up" link — goes to ChalkAI sign-up flow
- "New to Arbor AI? Contact your school admin." note at bottom

### What NOT to include
- No Google/Apple/SSO buttons (explicit product decision)
- No "Remember me" checkbox (session persists by default)
- No school code field (school membership handled via admin invite)

---

## 7. ChalkAI — Core Spec

### Two modes

**Mode A: Resource Generator**
- Structured form → fills template → calls Anthropic → split-panel output
- 4 resource types: Lesson Plan, Worksheet, Quiz, Parent Email
- One-click refinements after generation
- Inline save to history

**Mode B: AI Assistant**
- Conversational chat with clarify-then-deliver behaviour
- Slash commands: `/bloom`, `/retrieval`, `/differentiate`, `/exit-ticket`, `/hinge`, `/success-criteria`
- Response parser handles `CLARIFY:`, `RESOURCE:`, and plain text formats
- Tap-to-answer option chips for clarification questions

### Teacher Profile Schema

```typescript
interface TeacherProfile {
  firstName:    string
  lastName:     string
  email:        string
  yearGroups:   string[]      // e.g. ["Year 7", "Year 8"]
  curriculum:   string        // e.g. "UK National Curriculum"
  country:      string        // e.g. "UK"
  phase:        string        // "Primary" | "Secondary" | "Sixth Form / FE" | "SEN School"
  lessonLength: string        // e.g. "60 minutes"
  classProfile: string[]      // e.g. ["Mixed ability", "EAL students"]
  outputStyle:  string        // "Concise" | "Detailed" | "Balanced"
  subjects?:    string[]
}
```

### Prompt architecture (3 layers)

**Layer 1 — System prompt (every call):**
```
You are an expert teaching assistant.
You create high-quality, classroom-ready resources that are age-appropriate,
practical, clearly structured, and aligned with curriculum expectations.
```

**Layer 2 — Resource templates** (see Section 10 for full templates)

**Layer 3 — User input injection** at call time from form + profile

### Refinement pattern
```
{refinement_instruction}
Keep it classroom-ready and practical.
---
[original resource output here]
```

### Resource type accent colours
```
Lesson Plan:  #e8a32a  (amber)
Worksheet:    #4a9e6b  (green)
Quiz:         #c9a84c  (gold)
Parent Email: #4a7fe8  (blue)
```

---

## 8. Arbor AI — Core Spec

### What it does
- Accepts CSV exports from Arbor MIS (or any school spreadsheet in the mock format)
- Parses into structured school data: pupils, attendance, subject attainment, risk profiles
- Displays a role-filtered dashboard (Headteacher / Year Lead / Class Teacher)
- Answers natural language questions using OpenAI with the full school data as context
- Generates per-pupil AI pastoral summaries

### Supported CSV formats

**Mock spreadsheet format (sample included):**
```
Student ID, First Name, Last Name, Year Group, Date of Birth, Sex,
Reading, Writing, Maths, Science, History, Geography, Computing, Art, Music, PE, RE,
Attendance %, Persistent Absence
```

**Arbor MIS export format:**
```
UPN, Legal Forename, Legal Surname, NC Year, Date of Birth, Gender, Attendance %
```

Converting Excel to CSV: File → Save As → CSV.

### Data flow

```
/arbor/upload
  ↓ POST /api/upload → lib/csvParser.ts → ParsedSchoolData
  ↓ stored in sessionStorage (lib/schoolStore.ts)
  ↓ navigates to /arbor/dashboard

/arbor/dashboard
  ↓ server renders with mock data
  ↓ DashboardClient.useEffect reads sessionStorage
  ↓ recomputes all panels from live data
  ↓ "Live data" badge + import timestamp shown

/arbor/pupil/[id]
  ↓ "Generate AI summary" button
  ↓ POST /api/pupils/[id]/summary with full school data
  ↓ lib/ai.ts → OpenAI (or template fallback)
  ↓ returns narrative + recommended actions

Dashboard chat
  ↓ lib/schoolContext.ts builds structured context from all 210+ pupils
  ↓ POST /api/insights with query + full context + conversation history
  ↓ OpenAI answers with specific names, numbers, year groups
```

### Role-based access

| Role value | Display name | Data scope |
|------------|--------------|------------|
| `slt`      | Headteacher  | All year groups |
| `hoy`      | Year Lead    | Selected year group |
| `teacher`  | Class Teacher | Selected class |

Stored in URL param (`?role=slt`) and in NextAuth session claims.

### Dashboard panels (customisable per role)

All panels can be toggled on/off per role via the Customise sidebar. Layout saved in `localStorage` under key `arbor-dashboard-config-{role}`.

| Panel ID | Default | Roles |
|----------|---------|-------|
| `summaryCards` | On | All (required) |
| `priorityPupils` | On | All |
| `aiActions` | On | All |
| `attendanceBars` | On | SLT, HOY |
| `attainmentInsights` | On | All |
| `subjectAttainment` | On | SLT only |
| `auditLog` | On | SLT, HOY |

### AI context builder (`lib/schoolContext.ts`)

Before every chat query, a structured context string is built containing:
- School overview (total pupils, boys/girls split, attendance, PA count)
- Per year group: pupil count, gender split, attendance %, PA count, high-priority count
- Subject attainment: every subject with % below expected, % at expected, % at greater depth
- Core subjects (Reading, Writing, Maths) by year group
- Full pupil list: every pupil's name, year, sex, attendance, risk level, subjects below expected
- Top priority pupils with flag descriptions

This context is sent with every OpenAI call so it can answer questions like "how many boys in Year 1?" or "which Year 3 pupils are below expected in Writing?"

### Key types

```typescript
// Pupil
interface Pupil {
  id: string; firstName: string; lastName: string; fullName: string
  initials: string; yearGroup: YearGroup; className: string
  dateOfBirth: string; sex: 'Male' | 'Female'; avatarColor: { bg: string; text: string }
}

// Risk profile
interface RiskProfile {
  pupilId: string; riskLevel: 'high' | 'medium' | 'low' | 'none'
  flags: PastoralFlag[]; overallScore: number; generatedAt: string
}

// Risk flag reasons
type FlagReason = 'persistent_absence' | 'attainment_concern' | 'lateness_pattern' | 'combined_risk'

// Assessment band
type AttainmentBand = 'Pre-Working Towards' | 'Working Towards' | 'Expected' | 'Greater Depth'

// Dashboard config
type PanelId = 'summaryCards' | 'priorityPupils' | 'aiActions' | 'attendanceBars'
             | 'attainmentInsights' | 'subjectAttainment' | 'auditLog'
```

---

## 9. Database Schema (Supabase/Postgres — combined)

```sql
-- ── Shared auth ────────────────────────────────────────────

users (
  id              uuid PRIMARY KEY,
  email           text UNIQUE NOT NULL,
  created_at      timestamptz DEFAULT now(),
  plan            text DEFAULT 'free',   -- 'free' | 'pro' | 'school'
  role            text DEFAULT 'teacher', -- 'teacher' | 'hoy' | 'slt' | 'admin'
  school_id       uuid REFERENCES schools,
  stripe_customer_id text,
  last_active_tool text DEFAULT 'chalkai' -- 'chalkai' | 'arbor'
)

schools (
  id              uuid PRIMARY KEY,
  name            text NOT NULL,
  phase           text,                  -- 'primary' | 'secondary' | 'mixed'
  created_at      timestamptz DEFAULT now()
)

-- ── ChalkAI ────────────────────────────────────────────────

teacher_profiles (
  id              uuid PRIMARY KEY,
  user_id         uuid REFERENCES users,
  first_name      text,
  last_name       text,
  year_groups     text[],
  curriculum      text,
  country         text,
  phase           text,
  lesson_length   text,
  class_profile   text[],
  output_style    text,
  subjects        text[],
  updated_at      timestamptz
)

resources (
  id              uuid PRIMARY KEY,
  user_id         uuid REFERENCES users,
  type            text,                  -- 'lesson_plan' | 'worksheet' | 'quiz' | 'email'
  title           text,
  topic           text,
  subject         text,
  year_group      text,
  content         text,                  -- full markdown
  created_at      timestamptz
)

conversations (
  id              uuid PRIMARY KEY,
  user_id         uuid REFERENCES users,
  title           text,
  created_at      timestamptz,
  updated_at      timestamptz
)

conversation_messages (
  id              uuid PRIMARY KEY,
  conversation_id uuid REFERENCES conversations,
  role            text,                  -- 'user' | 'assistant'
  content         text,
  created_at      timestamptz
)

-- ── Arbor AI ───────────────────────────────────────────────

-- Replaces sessionStorage when DB is added
school_imports (
  id              uuid PRIMARY KEY,
  school_id       uuid REFERENCES schools,
  imported_by     uuid REFERENCES users,
  imported_at     timestamptz DEFAULT now(),
  pupil_count     int,
  source_format   text,                  -- 'mock-spreadsheet' | 'arbor-export'
  raw_data        jsonb                  -- full ParsedSchoolData
)

-- Per-user dashboard config (replaces localStorage)
dashboard_configs (
  user_id         uuid REFERENCES users,
  role            text,
  panels          jsonb DEFAULT '{}',    -- Record<PanelId, boolean>
  updated_at      timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, role)
)

-- ── Shared usage tracking ──────────────────────────────────

usage_events (
  id              uuid PRIMARY KEY,
  user_id         uuid REFERENCES users,
  tool            text,                  -- 'chalkai' | 'arbor'
  event_type      text,                  -- 'generation' | 'refinement' | 'chat' | 'summary' | 'upload'
  resource_type   text,
  tokens_input    int,
  tokens_output   int,
  created_at      timestamptz
)
```

---

## 10. ChalkAI Prompt Templates (full)

### Lesson Plan
```
Act as an experienced {country} teacher using the {curriculum}.
Create a lesson plan for {year_group} {subject} on: "{topic}".

Context:
- Lesson length: {duration}
- Class profile: {class_profile}
- Additional notes: {notes}

Include:
## Learning Objective
## Success Criteria (3 bullet points)
## Starter Activity (5–10 mins)
## Main Activities (with timings)
## Plenary
## Differentiation (Support / Expected / Challenge)
## Assessment for Learning
## Resources Needed
```

### Worksheet
```
Create a student-facing worksheet for {year_group} {subject} on: "{topic}".
Learning focus: {focus}
Class profile: {class_profile}

Structure:
## [Title]
**Learning Objective:** one sentence
## Warm Up (2–3 recall questions)
## Main Tasks (5–8 questions, recall → apply)
## Challenge (1–2 extended questions)
## Reflection
```

### Quiz
```
Create a {quiz_type} quiz for {year_group} {subject} on: "{topic}".
Duration: {duration} | Questions: {num_questions}

Questions should progress:
- Q1–3: Recall [1 mark]
- Q4–6: Understanding [2 marks]
- Q7–9: Application [2–3 marks]
- Q10: Extended response [4–6 marks]

Include full Mark Scheme at the end.
```

### Parent Email
```
Write a professional parent/guardian email about: "{topic}".
Year group: {year_group} | Subject: {subject}
Purpose: {purpose} | Tone: {tone}

Structure: Subject line → Opening → Main body → Home support tips (3) → Closing
Under 250 words. No jargon.
```

### Assistant system prompt
```
You are ChalkAI, an expert teaching assistant for {phase} school teachers in {country}.

Teacher profile:
- Name: {firstName} {lastName}
- Year groups: {yearGroups}
- Curriculum: {curriculum}
- Lesson length: {lessonLength}
- Class profile: {classProfile}
- Output style: {outputStyle}

Before generating a resource, ask ONE clarifying question if:
- The topic is vague (e.g. "something on maths")
- Year group is unclear and profile doesn't cover it
- Multiple resource types would be equally valid

When asking: warm, conversational, 1–2 sentences max.
Response format: CLARIFY:\n[question]\nOPTIONS: ["A","B","C"] (options optional)

When generating: RESOURCE: [type]\nTITLE: [title]\n---\n[markdown]

Pedagogical frameworks to apply silently:
Bloom's Taxonomy, retrieval practice, spaced repetition,
formative assessment (exit tickets, hinge questions),
differentiation (support/expected/challenge),
Rosenshine's Principles, SEND and EAL adaptations.

Slash commands:
/bloom → apply Bloom's taxonomy to last resource
/retrieval → add retrieval practice tasks
/differentiate → generate support/expected/challenge
/exit-ticket → create 3-question exit ticket
/hinge → write a hinge question
/success-criteria → generate 3 success criteria
```

---

## 11. Prototype Files (ChalkAI — source of truth)

These HTML files exist from the ChalkAI prototype. Use them as reference when building Next.js components.

| File | Screens | Status |
|------|---------|--------|
| `chalkai-landing.html` | Full SaaS marketing landing page | ✅ Complete |
| `chalkai-signup-v2.html` | Sign up + profile wizard (3 steps) + dashboard empty state | ✅ Complete |
| `chalkai-generators.html` | Home dashboard + all 4 resource generator pages | ✅ Complete |
| `chalkai-assistant.html` | AI assistant chat interface | ✅ Complete |
| `teacher-assistant.jsx` | Early React MVP | ⚠️ Superseded |
| `chalkai-signup-onboarding.html` | Earlier signup with SSO | ❌ Discarded — do not use |

---

## 12. Arbor AI — Existing Next.js Code

The Arbor AI tool is already built as a standalone Next.js project (`arbor-ai/`). When merging into the unified platform:

### Files to move directly (no changes needed)

```
arbor-ai/lib/csvParser.ts          → lib/arbor/csvParser.ts
arbor-ai/lib/schoolStore.ts        → lib/arbor/schoolStore.ts
arbor-ai/lib/schoolContext.ts      → lib/arbor/schoolContext.ts
arbor-ai/lib/ai.ts                 → lib/arbor/ai.ts
arbor-ai/lib/dashboardConfig.ts    → lib/arbor/dashboardConfig.ts
arbor-ai/lib/data/mock.ts          → lib/arbor/data/mock.ts
arbor-ai/lib/data/queries.ts       → lib/arbor/data/queries.ts
arbor-ai/hooks/useDashboardConfig.ts → hooks/useDashboardConfig.ts
arbor-ai/types/index.ts            → merge into types/index.ts
```

### Components to move (update import paths only)

```
arbor-ai/components/dashboard/*   → components/arbor/dashboard/*
arbor-ai/components/pupil/*       → components/arbor/pupil/*
arbor-ai/components/ui/*          → merge with shared components/ui/*
```

### Pages to move (update to platform layout)

```
arbor-ai/app/upload/page.tsx       → app/(platform)/arbor/upload/page.tsx
arbor-ai/app/dashboard/page.tsx   → app/(platform)/arbor/dashboard/page.tsx
arbor-ai/app/pupil/[id]/page.tsx  → app/(platform)/arbor/pupil/[id]/page.tsx
```

### API routes to move (no logic changes)

```
arbor-ai/app/api/upload/           → app/api/upload/
arbor-ai/app/api/insights/         → app/api/insights/
arbor-ai/app/api/pupils/           → app/api/pupils/
```

### Arbor AI design changes when merging
- Remove standalone `Navbar` — replaced by shared platform navbar with tool switcher
- Remove upload button from navbar — it lives in `app/(platform)/arbor/upload/page.tsx`
- `globals.css` Arbor section imports into platform `globals.css` under `.arbor-tool { ... }`
- Tailwind `brand-*` colours stay as-is (green — distinct from ChalkAI amber)

---

## 13. Pricing Model

| Plan | Price | ChalkAI limits | Arbor AI limits |
|------|-------|----------------|-----------------|
| Free | £0 | 5 resource generations/month | 1 school upload, no AI summaries |
| Pro | £9/teacher/month | Unlimited + export | Unlimited uploads + AI summaries + chat |
| School | £6/teacher/month (min 5) | Everything Pro + shared library | All Pro features + admin dashboard + multi-user |

### API cost estimates

**ChalkAI (Claude Sonnet):**
- ~500 input + ~750 output tokens per generation ≈ $0.013/call
- 15-teacher school × 24 calls/month = ~$4.60/month API cost
- Against £90/month school revenue = ~94% gross margin

**Arbor AI (GPT-4o-mini):**
- Chat query with full school context: ~3,000–5,000 input tokens (context) + ~200 output ≈ $0.002/call
- Pupil summary: ~500 input + ~300 output ≈ $0.0004/call
- Negligible cost relative to ChalkAI

---

## 14. Key Product Decisions (do not revisit)

### ChalkAI
- Sign up is **email + password only** — no SSO/Google/Apple. Explicitly chosen.
- **Profile wizard is mandatory** before using the app — cannot skip to dashboard with empty profile.
- **Two modes are top-level** — Assistant and Generator are separate experiences.
- **Assistant clarifies before generating** — never dumps generic output on vague prompts.
- **Profile context always injected silently** — teachers never re-enter year group, curriculum etc.
- **Refinements wrap existing output** — do not regenerate from scratch.
- **Model**: `claude-sonnet-4-20250514` — do not switch to Haiku (quality difference matters).
- **Brand name**: ChalkAI — not TeacherAidPro or any other name.

### Arbor AI
- **Data never leaves the browser** until a database is added — stored in sessionStorage.
- **CSV upload, not direct API** — Arbor MIS API integration is the roadmap, not MVP.
- **Per-role dashboard customisation** — layouts saved per role in localStorage.
- **Full pupil data in AI context** — never send a summary; send the full structured data so OpenAI can answer specific questions.
- **Template fallback always works** — AI features degrade gracefully with no API key.
- **`isAiOn()` must be a function** — not a module-level constant — so it re-reads `process.env` per request.

### Combined platform
- **One login covers both tools** — no separate accounts.
- **Role in auth session** determines default landing tool.
- **Tool switcher in shared nav** — always visible once authenticated.
- **Last active tool saved** — users return to where they left off.

---

## 15. Screens Built vs Still To Build

### ChalkAI (prototype HTML — needs porting to Next.js)

| Screen | Status |
|--------|--------|
| Landing page | ✅ HTML prototype complete |
| Sign up + profile wizard | ✅ HTML prototype complete |
| Resource generator (all 4 types) | ✅ HTML prototype complete |
| AI assistant chat | ✅ HTML prototype complete |
| **Sign in page** | ❌ Not built |
| **Forgot password** | ❌ Not built |
| **Pro/School upgrade flow** | ❌ Not built |
| **Profile edit screen** | ❌ Not built |
| **Full history screen** | ❌ Not built |
| **Resource detail view** | ❌ Not built |
| **PDF export** | ❌ Not built |
| **Word export** | ❌ Not built |
| **School admin dashboard** | ❌ Not built |
| **Settings page** | ❌ Not built |
| **Mobile responsive pass** | ❌ Not done |

### Arbor AI (Next.js — already functional)

| Screen | Status |
|--------|--------|
| Upload page (CSV → parse → success) | ✅ Built |
| Dashboard (role-filtered, customisable) | ✅ Built |
| Pupil detail + AI summary | ✅ Built |
| AI chat with full school context | ✅ Built |
| **Shared sign-in integration** | ❌ Uses standalone nav — needs platform nav |
| **Persistent DB storage** | ❌ Currently sessionStorage only |
| **Multi-school support** | ❌ Single upload per session |
| **Arbor MIS API integration** | ❌ CSV only for now |
| **Excel (.xlsx) direct upload** | ❌ Must convert to CSV manually |
| **PDF export of pupil reports** | ❌ Not built |

---

## 16. Immediate Next Steps (priority order)

### Phase 1 — Unified scaffold (1–2 days)
1. Scaffold new Next.js project with TypeScript + Tailwind
2. Set up NextAuth with credentials provider (email + password)
3. Connect Supabase — migrate schema from Section 9
4. Create shared layout with tool switcher in navbar
5. Implement shared sign-in page (Section 6 spec)

### Phase 2 — Port Arbor AI (2–3 days)
6. Move all Arbor AI files into unified project (see Section 12 migration guide)
7. Replace standalone Arbor navbar with shared platform navbar
8. Wire auth session → role → dashboard scope
9. Persist dashboard config to `dashboard_configs` table (replace localStorage)
10. Persist school import to `school_imports` table (replace sessionStorage)

### Phase 3 — Port ChalkAI (3–5 days)
11. Port `chalkai-generators.html` → Next.js components
12. Port `chalkai-assistant.html` → Next.js components
13. Move Anthropic API calls server-side → `/api/generate` + `/api/chat`
14. Wire teacher profile to `teacher_profiles` table
15. Build sign-up + profile wizard in Next.js

### Phase 4 — Production features (ongoing)
16. Implement usage tracking + plan limits
17. Stripe integration — upgrade flow + webhook
18. PDF export (react-pdf or Puppeteer)
19. Word export (.docx)
20. Arbor MIS API integration (replace CSV parser)
21. Mobile responsive pass (both tools)
22. School admin dashboard

---

## 17. API Integration Notes

### ChalkAI (Anthropic) — server-side only

```typescript
// app/api/generate/route.ts
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: Request) {
  const { messages, systemPrompt } = await req.json()
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system:     systemPrompt,
    messages,
  })

  return Response.json({ content: response.content })
}
```

### Arbor AI (OpenAI) — server-side only

```typescript
// app/api/insights/route.ts
export async function POST(req: Request) {
  const { query, role, schoolContext, conversationHistory } = await req.json()

  // Build message array from history + new query
  // Pass to lib/arbor/ai.ts → generateChatResponse()
  // Returns { response, generatedAt }
}
```

### Rate limiting (both tools)

```typescript
// Middleware pattern — check before calling AI
async function checkUsageLimit(userId: string, tool: 'chalkai' | 'arbor') {
  const { data: user } = await supabase.from('users').select('plan').eq('id', userId).single()
  if (user.plan === 'free') {
    const count = await getMonthlyUsage(userId, tool)
    if (count >= 5) throw new Error('Free plan limit reached')
  }
}
```

---

*Last updated: April 2026. Built with Claude in claude.ai.*
*ChalkAI tool: prototype in HTML. Arbor AI tool: fully built in Next.js 14.*
