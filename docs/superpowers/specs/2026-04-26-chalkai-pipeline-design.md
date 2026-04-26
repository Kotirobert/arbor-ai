# ChalkAI Prompt Processing Pipeline — Design Spec

**Date:** 2026-04-26  
**Status:** Approved  
**Scope:** Full prompt pipeline for ChalkAI resource generation (text, image, presentation)

---

## 1. Context

ChalkAI is an AI-powered resource generator for primary/secondary school teachers. Currently the generator uses deterministic mock templates (`lib/chalkai/resourceTemplates.ts` → `mockOutputFor()`). This build replaces the mock layer with a real AI pipeline backed by OpenAI, running entirely server-side via a Next.js API route.

The existing UI (GeneratorForm, GeneratorPanel, ResourceOutput) is kept and extended — not replaced.

---

## 2. Architecture

The pipeline runs entirely server-side. The client never touches an API key.

```
Browser (GeneratorPanel)
    │
    │  POST /api/chalkai/generate
    │  { resourceType, input, profile, resourceSpecificFields }
    ▼
app/api/chalkai/generate/route.ts
    │
    ├─► lib/chalkai/piiScanner.ts        scan & sanitise
    ├─► lib/chalkai/promptEnricher.ts    build enriched prompt
    ├─► lib/chalkai/modelRouter.ts       route to correct model
    │       │
    │       ├── text (lesson_plan, worksheet, quiz, parent_letter)
    │       │       └─► lib/chalkai/openaiClient.ts (gpt-4o)
    │       │
    │       ├── image
    │       │       └─► lib/chalkai/openaiImageClient.ts (gpt-image-1)
    │       │
    │       └── presentation
    │               ├─► lib/chalkai/openaiClient.ts (JSON content via gpt-4o)
    │               ├─► lib/chalkai/gemmaClient.ts (stub → mockGemmaResponse)
    │               └─► lib/chalkai/pptxBuilder.ts
    │
    └── Response: { type, output, piiFindings? }
```

If `OPENAI_API_KEY` is not set, the route returns `503` with `{ error: 'API_KEY_NOT_CONFIGURED' }`.

---

## 3. File Structure

### New — pipeline (server-side, `lib/chalkai/`)

```
lib/chalkai/
  piiScanner.ts            Pure function — PII detection + sanitisation
  promptEnricher.ts        Profile + resource type → enriched prompt string
  modelRouter.ts           Routes enriched prompt to correct API client
  openaiClient.ts          GPT-4o wrapper (text + JSON mode)
  openaiImageClient.ts     gpt-image-1 wrapper (returns base64)
  gemmaClient.ts           Stub with mockGemmaResponse() until API key provided
  pptxBuilder.ts           pptxgenjs → PPTX blob (base64)
  templates/
    lessonPlan.ts
    worksheet.ts
    quiz.ts
    parentLetter.ts
    image.ts               Translates teacher description → optimised image prompt
    presentation.ts        Instructs GPT-4o to output slide JSON only
```

### New — API route

```
app/api/chalkai/generate/route.ts    POST handler, full pipeline
```

### Modified — UI components

```
components/chalkai/
  GeneratorForm.tsx        Add image + presentation form fields
  GeneratorPanel.tsx       POST to /api/chalkai/generate instead of mockOutputFor()
  ResourceOutput.tsx       Add image preview + PPTX download output types
  PIIWarningBanner.tsx     New — warn/block banner with findings list
  LoadingState.tsx         New — spinner for text/image, stepped progress for presentations
```

### Modified — types

```
types/index.ts    Add 'image' | 'presentation' to ResourceType
```

### Retired

```
lib/chalkai/resourceTemplates.ts    Replaced by lib/chalkai/templates/
```

---

## 4. API Contract

### Request

`POST /api/chalkai/generate`

```ts
{
  resourceType: 'lesson_plan' | 'worksheet' | 'quiz' | 'parent_letter' | 'image' | 'presentation'
  input: string                    // raw teacher input
  profile: {
    curriculum: string
    yearGroup: string
    subjectSpecialism: string
    classProfile: string
    lessonLength: string
    outputStyle: string
  }
  resourceSpecificFields?: {
    // image: intendedUse, orientation
    // presentation: objectives, slideCount, speakerNotes
    // quiz: numQuestions
    // parent_letter: tone, purpose
    [key: string]: string | number | boolean
  }
}
```

### Response variants

```ts
// Text resources
{ type: 'text', output: string, piiFindings: PIIFinding[] }

// Image
{ type: 'image', output: string /* base64 */, mimeType: 'image/png' }

// Presentation
{ type: 'pptx', output: string /* base64 */, filename: string }

// PII blocked — nothing sent to any model
{ type: 'pii_blocked', piiFindings: PIIFinding[], sanitised: string }

// Error
{ type: 'error', error: 'API_KEY_NOT_CONFIGURED' | 'GENERATION_FAILED', message: string }
```

---

## 5. PII Scanner

**File:** `lib/chalkai/piiScanner.ts`

**Detection rules:**

| Category | Pattern | Action |
|----------|---------|--------|
| Student first name | Capitalised word + behaviour verb (is/was/has/needs/struggles/told/asked) | Warn → replace with [STUDENT] |
| Title + name | Mr/Mrs/Ms/Dr/Miss + capitalised word | Warn → replace with [STAFF] |
| UK postcode | `[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}` | Block |
| Email | Standard email regex | Block |
| Phone (UK) | +44 or 0 followed by 9–10 digits | Block |
| School name | St/Saint X Primary/Secondary/Academy/School/College | Warn |

**Function signature:**

```ts
function scanForPII(text: string): {
  findings: Array<{ type: string; match: string; start: number; end: number; severity: 'warn' | 'block' }>
  sanitised: string
  blocked: boolean
}
```

**Flow:** If `blocked === true`, the API route returns `pii_blocked` immediately. If warn-only, generation proceeds with `sanitised` text and findings are returned to the client.

---

## 6. Prompt Enricher

**File:** `lib/chalkai/promptEnricher.ts`

Combines sanitised teacher input, teacher profile, and resource-specific template into a complete prompt string.

**Critical rules:**
- School name from profile is **never** injected into prompts
- Profile fields with empty values are skipped (no `undefined` in prompts)
- Year group always included for age-appropriate language

**Structure:**

```
[SYSTEM ROLE]
You are an expert teaching assistant for {curriculum} educators...

[RESOURCE TEMPLATE]
{Imported from lib/chalkai/templates/{resourceType}.ts}

[TEACHER REQUEST + CONTEXT]
Year group: {yearGroup}
Class profile: {classProfile}
Lesson length: {lessonLength}
Preferred style: {outputStyle}

Teacher's request: {sanitisedInput}

{resourceSpecificFields injected here}
```

---

## 7. Templates

**Folder:** `lib/chalkai/templates/`

Each file exports a function `(profile, fields) => string` returning the Layer 2 template section.

| File | Required sections |
|------|------------------|
| `lessonPlan.ts` | Learning Objectives, Success Criteria, Starter (5–10 min), Main Activity, Plenary, Differentiation (LA/MA/HA), Resources Needed, Assessment Notes |
| `worksheet.ts` | Clear instructions, tiered questions (3 levels), extension task, answer key |
| `quiz.ts` | 10 questions (mixed choice + short answer), answer key, mark scheme |
| `parentLetter.ts` | Greeting, purpose, action required, sign-off. Warm but professional tone |
| `image.ts` | Translates description → gpt-image-1 optimised prompt. Appends educational style + year-group appropriate. Sets aspect ratio from `intendedUse` |
| `presentation.ts` | Instructs GPT-4o to output JSON only (no markdown, no preamble) matching Slide JSON schema below |

**Slide JSON schema** (GPT-4o → Gemma contract):

```ts
{
  topic: string
  yearGroup: string
  themeDirection: string
  slideCount: number
  slides: Array<{
    type: 'title' | 'content' | 'image' | 'closing'
    title: string
    subtitle?: string
    bullets?: string[]           // max 5
    speakerNotes: string
    imageDescription: string | null
  }>
}
```

---

## 8. API Clients

### `openaiClient.ts`
- Model: `gpt-4o`
- Max tokens: 4000 (text), 6000 (presentation JSON)
- Presentation mode: enforce JSON-only output, strip markdown fences before parsing
- try/catch with user-friendly error on failure

### `openaiImageClient.ts`
- Model: `gpt-image-1`
- Returns base64 PNG
- Aspect ratio set from `intendedUse`: poster → portrait, display → landscape, others → square

### `gemmaClient.ts`
- Stub until Google API key provided
- If `GEMMA_API_KEY` unset → `mockGemmaResponse(slideContent)` returns themed mock data
- Mock response includes fake palette, fonts, and empty `imageBase64` fields

**Mock Gemma response shape:**
```ts
{
  theme: {
    palette: ['#1a1a2e', '#16213e', '#e8a32a', '#ffffff']
    primaryFont: 'DM Sans'
    accentFont: 'Instrument Serif'
    backgroundStyle: 'gradient'
  }
  slides: Array<{ ...originalSlide, imageBase64?: string }>
}
```

---

## 9. PPTX Builder

**File:** `lib/chalkai/pptxBuilder.ts`  
**Library:** `pptxgenjs`

- Applies Gemma theme (colours, fonts, background) to all slides
- Maps slide types to layouts: `title` → centred; `content` → title + bullets + optional image; `image` → full-bleed; `closing` → centred
- Embeds base64 images where present
- Adds speaker notes via `slide.addNotes()`
- Returns base64 string
- If `imageBase64` missing on a slide → renders without image (no crash)

---

## 10. UI Components

### `PIIWarningBanner.tsx`
- Props: `findings`, `onEdit`, `onContinue`
- Warn-level: amber banner, lists each finding + replacement. Buttons: [Edit prompt] [Continue with redactions]
- Block-level: red banner, no continue button. Button: [Edit prompt]

### `LoadingState.tsx`
- Text/image: single spinner with tip rotation
- Presentation: 4-step progress: "Checking your prompt…" → "Writing slide content…" → "Designing theme & generating visuals…" → "Assembling presentation…"

### `GeneratorForm.tsx` additions
- **Image:** description textarea, intended-use select (poster/diagram/display/scene), orientation radio (landscape/portrait/square)
- **Presentation:** topic textarea, objectives textarea, slide count input (5–20, default = `Math.round(lessonLength / 6)`), speaker notes toggle (default on)

### `GeneratorPanel.tsx`
- Replace `mockOutputFor()` call with `POST /api/chalkai/generate`
- Handle `pii_blocked` response → show PIIWarningBanner, halt
- Handle `API_KEY_NOT_CONFIGURED` → inline amber notice, no spinner
- Handle `pii_warn` findings → show PIIWarningBanner above output

### `ResourceOutput.tsx` additions
- `type === 'image'` → `<img>` from base64 + Download PNG button
- `type === 'pptx'` → file icon + Download .pptx button

---

## 11. Build Order

1. `piiScanner.ts` — pure function, no deps
2. `promptEnricher.ts` + all 6 templates
3. `openaiClient.ts` + `openaiImageClient.ts`
4. `app/api/chalkai/generate/route.ts` — wire text pipeline, test 4 text generators end-to-end
5. `PIIWarningBanner.tsx` + `LoadingState.tsx`
6. `GeneratorPanel.tsx` — swap `mockOutputFor()` for API call
7. Image generator — client + form fields + output panel
8. `gemmaClient.ts` stub + `pptxBuilder.ts` — presentation pipeline with mock data
9. Presentation form fields + stepped loading UI
10. `types/index.ts` updates throughout

---

## 12. Out of Scope

- Per-slide image generation via gpt-image-1 (Phase 2)
- Embedding generated images into worksheets (Phase 2)
- Multi-language output
- Collaborative editing
- Cloud-synced history (localStorage only for MVP)
- Real Gemma API integration (add key when provided)

---

## 13. Environment Variables

```
OPENAI_API_KEY=        # Required for all generation
GEMMA_API_KEY=         # Optional — stub used when absent
```
