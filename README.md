# ChalkAI — AI Tools for UK Schools

A Next.js platform with two products: **ChalkAI** (teaching assistant) and **Arbor AI** (pastoral data lens). Upload a spreadsheet CSV, get AI-powered insights — or generate lesson plans, worksheets, and quizzes in seconds.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # then add your OpenAI key
npm run dev
# → http://localhost:3000
```

---

## OpenAI setup

Edit `.env.local`:

```
OPENAI_API_KEY=sk-...
```

The app works **without a key** — it falls back to deterministic template responses. With a key it uses `gpt-4o-mini` for pupil summaries and chat queries.

To use a different model:
```
OPENAI_MODEL=gpt-4o
```

---

## Uploading data

Go to `/upload` and drop a CSV file. Two formats are supported:

**Mock spreadsheet format** (the included sample):
```
Student ID, First Name, Last Name, Year Group, Date of Birth, Sex,
Reading, Writing, Maths, ..., Attendance %, Persistent Absence
```

**Arbor MIS export format**:
```
UPN, Legal Forename, Legal Surname, NC Year, Date of Birth, Gender, Attendance %
```

To convert your `.xlsx` to CSV: open in Excel or Google Sheets → File → Download → CSV.

Uploaded data is stored in **sessionStorage** only — it never leaves your browser, clears when you close the tab, and is never sent to any third-party server.

---

## Project structure

```
app/
  (marketing)/          Landing page, pricing, sign-in, sign-up
  arbor/
    dashboard/          Arbor AI — main insights view (role-filtered)
    pupil/[id]/         Individual pupil detail + AI summary
    upload/             Arbor CSV upload flow
  chalkai/              ChalkAI assistant (lesson plans, worksheets, quizzes)
  dashboard/            Legacy redirect → /arbor/dashboard
  upload/               Legacy redirect → /arbor/upload
  api/
    upload/             POST: parse CSV, return structured data
    pupils/[id]/summary POST: generate AI pastoral summary
    insights/           POST: chat query handler

components/
  ui/                   Badge, Button, Card, Navbar, Skeleton, Toast
  dashboard/            SummaryCards, PriorityPanel, InsightsPanel,
                        AiActionsPanel, AuditLog, SubjectAttainmentPanel,
                        DashboardClient, CustomiseSidebar
  pupil/                PupilDetailClient
  chalkai/              AssistantChat, ChalkAiClient, ChatMessage,
                        GeneratorForm, GeneratorPanel, ModeTabs,
                        RefinementBar, ResourceOutput, ResourceTypeCard,
                        SlashCommandHint
  arbor/                ArborSidebar
  marketing/            Footer, FeatureGrid, Hero (landing page)
  platform/             AuthGuard (session-gated route wrapper)

lib/
  csvParser.ts          Parses CSV files → internal data model
  schoolStore.ts        sessionStorage store for uploaded data
  ai.ts                 OpenAI integration + template fallback
  dashboardConfig.ts    Per-role layout config (localStorage)
  auth/mockSession.ts   localStorage-based session + profile management
  chalkai/
    mockAssistant.ts    Mock AI responses for ChalkAI (no API key needed)
    resourceTemplates.ts Lesson plan / worksheet / quiz template strings
    slashCommands.ts    /bloom /differentiate /exit-ticket command parser
  data/mock.ts          210 real pupils from sample spreadsheet
  data/queries.ts       Data access layer (mock → Prisma swap)
  utils.ts              Formatting, colour helpers

hooks/
  useDashboardConfig.ts Manages dashboard panel show/hide state

types/index.ts          All domain types (UserRole, Pupil, SavedResource,
                        ChalkAiSession, TeacherProfile, ChalkAiTool…)
```

---

## Data flow

**Arbor AI**
```
Upload CSV
    ↓
app/api/upload  →  lib/csvParser.ts  →  ParsedSchoolData
    ↓
Client stores in sessionStorage (lib/schoolStore.ts)
    ↓
DashboardClient reads on mount, recomputes all panels
    ↓
Pupil page reads per-pupil record from store
    ↓
"Generate AI summary" → app/api/pupils/[id]/summary → lib/ai.ts → OpenAI
```

**ChalkAI**
```
User selects resource type + fills GeneratorForm
    ↓
lib/chalkai/mockAssistant.ts (→ OpenAI when key present)
    ↓
ResourceOutput renders content
    ↓
Slash command (/bloom etc.) → lib/chalkai/slashCommands.ts → refined output
    ↓
SavedResource stored in localStorage (TeacherProfile persists context)
```

---

## Dashboard customisation

Each role (Headteacher / Year Lead / Class Teacher) can toggle panels on/off.
Layout is saved per-role in `localStorage` — survives page refreshes.

Click **Customise** in the dashboard top bar to open the panel editor.

---

## Roadmap to production

| Step | Status | What changes |
|------|--------|-------------|
| Two-product platform (ChalkAI + Arbor AI) | ✅ Done | Marketing site, feature grid, two routed tools |
| ChalkAI assistant | ✅ Done | Lesson plans, worksheets, quizzes, slash commands, resource library |
| Arbor AI pastoral dashboard | ✅ Done | CSV upload, role-filtered dashboard, AI pupil summaries, chat queries |
| Mock auth (localStorage) | ✅ Done | `lib/auth/mockSession.ts`, `AuthGuard`, sign-in / sign-up pages |
| Vercel deployment | ✅ Done | CI-clean build, `framework: nextjs`, typed routes, ES2018 target |
| Real auth | 🔲 Next | Replace mock session with NextAuth.js — `UserRole` maps to session claims |
| PostgreSQL | 🔲 Next | Replace `lib/data/mock.ts` + `lib/schoolStore.ts` with Prisma queries |
| Arbor MIS API | 🔲 Next | Replace `lib/csvParser.ts` with Arbor REST fetch — `ParsedSchoolData` shape stays identical |
| ChalkAI AI backend | 🔲 Next | Wire `GeneratorForm` to real OpenAI calls; replace `mockAssistant.ts` |
| Multi-school | 🔲 Later | Add `schoolId` to all queries, configs, and session claims |
| Teacher profile persistence | 🔲 Later | Persist `TeacherProfile` in DB so context survives sign-out |

---

## Roles

| Role | Label | Scope |
|------|-------|-------|
| `slt` | Headteacher | All year groups |
| `hoy` | Year Lead | Selected year group |
| `teacher` | Class Teacher | Selected class |
