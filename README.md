# Arbor AI — School Data Assistant

A Next.js MVP for UK primary schools. Upload a spreadsheet CSV, get AI-powered pastoral insights.

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
  upload/               Upload flow — drag-drop, parse, store
  dashboard/            Main insights view (role-filtered)
  pupil/[id]/           Individual pupil detail + AI summary
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

lib/
  csvParser.ts          Parses CSV files → internal data model
  schoolStore.ts        sessionStorage store for uploaded data
  ai.ts                 OpenAI integration + template fallback
  dashboardConfig.ts    Per-role layout config (localStorage)
  data/mock.ts          210 real pupils from sample spreadsheet
  data/queries.ts       Data access layer (mock → Prisma swap)
  utils.ts              Formatting, colour helpers

hooks/
  useDashboardConfig.ts Manages dashboard panel show/hide state

types/index.ts          All domain types
```

---

## Data flow

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

---

## Dashboard customisation

Each role (Headteacher / Year Lead / Class Teacher) can toggle panels on/off.
Layout is saved per-role in `localStorage` — survives page refreshes.

Click **Customise** in the dashboard top bar to open the panel editor.

---

## Roadmap to production

| Step | What changes |
|------|-------------|
| Add PostgreSQL | Replace `lib/data/mock.ts` + `lib/schoolStore.ts` with Prisma queries |
| Arbor API | Replace `lib/csvParser.ts` with Arbor REST API fetch — `ParsedSchoolData` shape stays identical |
| Auth | Add NextAuth.js — `UserRole` maps to session claims |
| Multi-school | Add `schoolId` to all queries and configs |

---

## Roles

| Role | Label | Scope |
|------|-------|-------|
| `slt` | Headteacher | All year groups |
| `hoy` | Year Lead | Selected year group |
| `teacher` | Class Teacher | Selected class |
