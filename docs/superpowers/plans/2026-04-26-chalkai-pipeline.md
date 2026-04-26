# ChalkAI Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ChalkAI's deterministic mock templates with a real AI pipeline (OpenAI GPT-4o for text, gpt-image-1 for images, GPT-4o + Gemma stub for presentations) running server-side behind a Next.js API route.

**Architecture:** Client POSTs to `/api/chalkai/generate`. The route runs PII scan → prompt enrichment → model router → returns typed JSON. The OpenAI key never touches the browser. Gemma is stubbed until the API key arrives.

**Tech Stack:** Next.js App Router, TypeScript, OpenAI SDK (already installed), pptxgenjs (new), vitest (new for unit tests).

---

## Task 1: Install dependencies + update types

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Modify: `types/index.ts`

- [ ] **Step 1: Install new packages**

```bash
cd "/Users/kotirobert/websites/arbor ai"
npm install pptxgenjs
npm install -D vitest @vitest/coverage-v8
```

Expected: packages added to `node_modules`.

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run"
```

- [ ] **Step 4: Update types/index.ts**

Replace the existing ChalkAI section (lines 125–138) with:

```ts
// ── ChalkAI resource types ────────────────────────────────────

export type ResourceType =
  | 'lesson_plan'
  | 'worksheet'
  | 'quiz'
  | 'parent_email'
  | 'image'
  | 'presentation'

export interface PIIFinding {
  type: string
  match: string
  start: number
  end: number
  severity: 'warn' | 'block'
}

export interface GenerateRequest {
  resourceType: ResourceType
  input: string
  profile: {
    curriculum: string
    yearGroup: string
    subjectSpecialism: string
    classProfile: string
    lessonLength: string
    outputStyle: string
  }
  resourceSpecificFields?: Record<string, string | number | boolean>
}

export type GenerateResponse =
  | { type: 'text'; output: string; piiFindings: PIIFinding[] }
  | { type: 'image'; output: string; mimeType: 'image/png' }
  | { type: 'pptx'; output: string; filename: string }
  | { type: 'pii_blocked'; piiFindings: PIIFinding[]; sanitised: string }
  | { type: 'error'; error: 'API_KEY_NOT_CONFIGURED' | 'GENERATION_FAILED'; message: string }

export interface GenerateFormInput {
  resourceType: ResourceType
  topic: string
  yearGroup: string
  subject?: string
  duration?: string
  notes?: string
  numQuestions?: string
  tone?: string
  purpose?: string
  intendedUse?: 'poster' | 'diagram' | 'display' | 'scene'
  orientation?: 'landscape' | 'portrait' | 'square'
  objectives?: string
  slideCount?: number
  speakerNotes?: boolean
}

export interface SavedResource {
  id:        string
  type:      ResourceType
  title:     string
  topic:     string
  yearGroup: string
  subject:   string | undefined
  content:   string
  createdAt: string
}
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts types/index.ts
git commit -m "feat: add pptxgenjs, vitest, and ChalkAI pipeline types"
```

---

## Task 2: PII Scanner

**Files:**
- Create: `lib/chalkai/piiScanner.ts`
- Create: `lib/chalkai/__tests__/piiScanner.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `lib/chalkai/__tests__/piiScanner.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { scanForPII } from '../piiScanner'

describe('scanForPII', () => {
  it('detects student name pattern', () => {
    const result = scanForPII('Tommy struggles with fractions')
    expect(result.findings).toHaveLength(1)
    expect(result.findings[0].type).toBe('studentName')
    expect(result.findings[0].severity).toBe('warn')
    expect(result.sanitised).toContain('[STUDENT]')
    expect(result.blocked).toBe(false)
  })

  it('detects staff title + name', () => {
    const result = scanForPII('Mrs Henderson said the class did well')
    expect(result.findings).toHaveLength(1)
    expect(result.findings[0].type).toBe('staffName')
    expect(result.findings[0].severity).toBe('warn')
    expect(result.sanitised).toContain('[STAFF]')
    expect(result.blocked).toBe(false)
  })

  it('blocks email addresses', () => {
    const result = scanForPII('Contact me at teacher@school.co.uk')
    expect(result.blocked).toBe(true)
    expect(result.findings[0].severity).toBe('block')
    expect(result.findings[0].type).toBe('email')
  })

  it('blocks UK phone numbers', () => {
    const result = scanForPII('Call 07700 900123 for details')
    expect(result.blocked).toBe(true)
    expect(result.findings[0].type).toBe('phone')
  })

  it('blocks UK postcodes', () => {
    const result = scanForPII('We are at SW1A 2AA')
    expect(result.blocked).toBe(true)
    expect(result.findings[0].type).toBe('postcode')
  })

  it('does not flag historical/subject terms as student names', () => {
    const result = scanForPII('The Romans built roads across Britain')
    expect(result.findings).toHaveLength(0)
    expect(result.blocked).toBe(false)
  })

  it('returns clean text unchanged when no PII', () => {
    const text = 'Teach fractions using pie charts for Year 4'
    const result = scanForPII(text)
    expect(result.findings).toHaveLength(0)
    expect(result.sanitised).toBe(text)
    expect(result.blocked).toBe(false)
  })

  it('warns on school name pattern', () => {
    const result = scanForPII('At St Mary Primary School we teach')
    expect(result.findings[0].type).toBe('schoolName')
    expect(result.findings[0].severity).toBe('warn')
  })
})
```

- [ ] **Step 2: Run tests — verify they all fail**

```bash
cd "/Users/kotirobert/websites/arbor ai"
npx vitest run lib/chalkai/__tests__/piiScanner.test.ts
```

Expected: all tests fail with "Cannot find module '../piiScanner'".

- [ ] **Step 3: Implement piiScanner.ts**

Create `lib/chalkai/piiScanner.ts`:

```ts
import type { PIIFinding } from '@/types'

export interface PIIScanResult {
  findings: PIIFinding[]
  sanitised: string
  blocked: boolean
}

// Behaviour verbs that suggest a student name precedes them
const BEHAVIOUR_VERBS = /\b(is|was|has|needs|struggles|told|asked|said|finds|found|works|worked|tries|tried|shows|showed|loves|hates|enjoys|refuses|refused|cried|hit|threw|shouted)\b/i

// Common noun/adjective words that are capitalised but not names
const NOT_A_NAME = new Set([
  'The', 'Romans', 'Greeks', 'Vikings', 'Egyptians', 'Tudors', 'Victorians',
  'English', 'French', 'Spanish', 'German', 'Italian', 'Chinese', 'Japanese',
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
  'Britain', 'England', 'Scotland', 'Wales', 'Ireland', 'London', 'Europe',
  'I', 'God', 'Christmas', 'Easter', 'Islam', 'Christianity', 'Hindu',
])

const PATTERNS: Array<{
  type: string
  severity: 'warn' | 'block'
  regex: RegExp
  replacement: string
}> = [
  {
    type: 'email',
    severity: 'block',
    regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    replacement: '[EMAIL]',
  },
  {
    type: 'phone',
    severity: 'block',
    regex: /(\+44\s?|0)(\d[\s-]?){9,10}\d/g,
    replacement: '[PHONE]',
  },
  {
    type: 'postcode',
    severity: 'block',
    regex: /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/g,
    replacement: '[POSTCODE]',
  },
  {
    type: 'schoolName',
    severity: 'warn',
    regex: /\b(St\.?\s+|Saint\s+)\w+(\s+(Primary|Secondary|Academy|School|College|Junior|Infant|High))+/gi,
    replacement: '[SCHOOL]',
  },
  {
    type: 'staffName',
    severity: 'warn',
    regex: /\b(Mr|Mrs|Ms|Dr|Miss)\.?\s+[A-Z][a-z]+\b/g,
    replacement: '[STAFF]',
  },
]

export function scanForPII(text: string): PIIScanResult {
  const findings: PIIFinding[] = []
  let sanitised = text
  let offset = 0

  // Run fixed-pattern rules first
  for (const rule of PATTERNS) {
    const regex = new RegExp(rule.regex.source, rule.regex.flags.replace('g', '') + 'g')
    let match: RegExpExecArray | null
    while ((match = regex.exec(sanitised)) !== null) {
      findings.push({
        type: rule.type,
        match: match[0],
        start: match.index,
        end: match.index + match[0].length,
        severity: rule.severity,
      })
    }
    sanitised = sanitised.replace(new RegExp(rule.regex.source, rule.regex.flags.replace('g', '') + 'g'), rule.replacement)
  }

  // Student name heuristic: Capitalised word immediately before a behaviour verb
  const studentRegex = /\b([A-Z][a-z]{1,14})\s+(?=\S)/g
  let m: RegExpExecArray | null
  while ((m = studentRegex.exec(sanitised)) !== null) {
    const word = m[1]
    if (NOT_A_NAME.has(word)) continue
    // Check if a behaviour verb follows within the next 40 chars
    const after = sanitised.slice(m.index + word.length, m.index + word.length + 40)
    if (BEHAVIOUR_VERBS.test(after)) {
      findings.push({
        type: 'studentName',
        match: word,
        start: m.index,
        end: m.index + word.length,
        severity: 'warn',
      })
      sanitised = sanitised.slice(0, m.index) + '[STUDENT]' + sanitised.slice(m.index + word.length)
    }
  }

  const blocked = findings.some((f) => f.severity === 'block')
  return { findings, sanitised, blocked }
}
```

- [ ] **Step 4: Run tests — verify they all pass**

```bash
npx vitest run lib/chalkai/__tests__/piiScanner.test.ts
```

Expected: 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/chalkai/piiScanner.ts lib/chalkai/__tests__/piiScanner.test.ts
git commit -m "feat: add PII scanner with unit tests"
```

---

## Task 3: Prompt Templates

**Files:**
- Create: `lib/chalkai/templates/lessonPlan.ts`
- Create: `lib/chalkai/templates/worksheet.ts`
- Create: `lib/chalkai/templates/quiz.ts`
- Create: `lib/chalkai/templates/parentLetter.ts`
- Create: `lib/chalkai/templates/image.ts`
- Create: `lib/chalkai/templates/presentation.ts`

Each template exports `buildTemplate(profile, fields): string` returning the Layer 2 section of the enriched prompt.

- [ ] **Step 1: Create lessonPlan template**

Create `lib/chalkai/templates/lessonPlan.ts`:

```ts
export function buildTemplate(): string {
  return `Generate a complete lesson plan with the following sections:

## Learning Objectives
State 1–2 clear, measurable learning objectives beginning with "Pupils will be able to..."

## Success Criteria
3–4 "I can..." statements at different levels of challenge.

## Starter Activity (5–10 minutes)
A retrieval or hook activity to engage prior knowledge.

## Main Activities
Two or three sequenced activities with timings. Use I do / We do / You do structure where appropriate.

## Plenary (5–8 minutes)
A consolidation activity or exit ticket.

## Differentiation
- **Support (LA):** scaffolding strategies
- **Expected (MA):** standard pathway
- **Challenge (HA):** extension and depth

## Resources Needed
List materials, tech, or printed resources required.

## Assessment Notes
One formative assessment strategy used during the lesson.

Format the output in clean markdown. Do not include any preamble or closing remarks outside the sections above.`
}
```

- [ ] **Step 2: Create worksheet template**

Create `lib/chalkai/templates/worksheet.ts`:

```ts
export function buildTemplate(): string {
  return `Generate a classroom worksheet with the following sections:

## Instructions
Clear, pupil-facing instructions explaining what to do.

## Section 1 — Foundation (accessible to all)
3–4 questions at a recall or recognition level.

## Section 2 — Core (expected standard)
4–5 questions requiring understanding and application.

## Section 3 — Challenge (greater depth)
2–3 open-ended or extended questions requiring reasoning or justification.

## Extension Task
One creative or transfer task for early finishers.

## Answer Key
Provide correct answers for all questions (teacher-facing). Mark with "ANSWER KEY:" heading.

Format in clean markdown. Write all content in age-appropriate language for the specified year group.`
}
```

- [ ] **Step 3: Create quiz template**

Create `lib/chalkai/templates/quiz.ts`:

```ts
export function buildTemplate(): string {
  return `Generate a classroom quiz with the following requirements:

- Mix of question types: multiple choice, short answer, and at least one extended response
- Questions ordered from recall → understanding → application → analysis
- Each question labelled with its type and mark allocation in square brackets, e.g. [Recall, 1 mark]
- Total marks clearly stated at the top

## Mark Scheme
After all questions, provide a complete mark scheme under a "MARK SCHEME" heading, including:
- Correct answers for objective questions
- Band descriptors for extended questions (1–2 marks, 3–4 marks etc.)
- Accept / Do not accept notes where answers may vary

Format in clean markdown. Do not number sections — just number the questions.`
}
```

- [ ] **Step 4: Create parentLetter template**

Create `lib/chalkai/templates/parentLetter.ts`:

```ts
export function buildTemplate(): string {
  return `Generate a professional parent/carer letter or email with the following structure:

**Greeting:** "Dear Parent / Carer,"

**Opening paragraph:** State the purpose clearly in 1–2 sentences. Be warm but direct.

**Main body (1–2 paragraphs):** Provide relevant context or information. If an action is required from the parent, state it explicitly.

**Support at home (optional):** If relevant, include 2–3 bullet points for how parents can support at home.

**Closing:** A positive, supportive sign-off followed by "Kind regards, [Teacher's name]"

Tone: warm, professional, jargon-free. Target reading age: accessible to all parents. Length: under 250 words unless the topic demands more.

Do not include a school letterhead, date, or address — just the letter body.`
}
```

- [ ] **Step 5: Create image template**

Create `lib/chalkai/templates/image.ts`:

```ts
export function buildImagePrompt(
  description: string,
  yearGroup: string,
  intendedUse: string,
  orientation: string,
): string {
  const aspectMap: Record<string, string> = {
    poster: 'portrait orientation (A3 poster format)',
    display: 'landscape orientation (classroom display)',
    diagram: 'square format (diagram or infographic)',
    scene: 'landscape orientation (scene illustration)',
  }
  const aspectNote = aspectMap[intendedUse] ?? 'square format'

  return [
    description,
    `Educational illustration suitable for ${yearGroup} pupils.`,
    `Style: clear, colourful, classroom-appropriate.`,
    `No text overlays unless specifically requested.`,
    `${aspectNote}.`,
    `Bright and engaging. Safe for school use.`,
  ].join(' ')
}
```

- [ ] **Step 6: Create presentation template**

Create `lib/chalkai/templates/presentation.ts`:

```ts
export function buildTemplate(): string {
  return `Generate a classroom presentation as a JSON object. Output ONLY the JSON — no markdown fences, no preamble, no explanation.

The JSON must match this exact schema:
{
  "topic": "string",
  "yearGroup": "string",
  "themeDirection": "string — e.g. 'bright, science-themed, colourful'",
  "slideCount": number,
  "slides": [
    {
      "type": "title" | "content" | "image" | "closing",
      "title": "string",
      "subtitle": "string or omit",
      "bullets": ["max 5 bullet strings"] or omit,
      "speakerNotes": "string — what the teacher would say",
      "imageDescription": "string describing an image to generate, or null if no image needed"
    }
  ]
}

Rules:
- First slide must be type "title"
- Last slide must be type "closing"
- Content slides may have bullets OR imageDescription (not both)
- Title and concept-introduction slides usually benefit from an image
- Bullet-heavy slides: set imageDescription to null
- Speaker notes on every slide, 2–4 sentences
- Bullets: concise, pupil-facing language
- Output valid JSON only — no trailing commas`
}
```

- [ ] **Step 7: Commit**

```bash
git add lib/chalkai/templates/
git commit -m "feat: add six prompt templates for ChalkAI pipeline"
```

---

## Task 4: Prompt Enricher

**Files:**
- Create: `lib/chalkai/promptEnricher.ts`
- Create: `lib/chalkai/__tests__/promptEnricher.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/chalkai/__tests__/promptEnricher.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildEnrichedPrompt } from '../promptEnricher'
import type { GenerateRequest } from '@/types'

const baseProfile: GenerateRequest['profile'] = {
  curriculum: 'KS2 / England National Curriculum',
  yearGroup: 'Year 4',
  subjectSpecialism: 'Maths',
  classProfile: 'Mixed ability, 2 EAL',
  lessonLength: '60 minutes',
  outputStyle: 'Practical and hands-on',
}

it('builds a prompt for lesson_plan', () => {
  const prompt = buildEnrichedPrompt({
    resourceType: 'lesson_plan',
    input: 'Teach fractions — halves and quarters',
    profile: baseProfile,
    resourceSpecificFields: {},
  })
  expect(prompt).toContain('KS2 / England National Curriculum')
  expect(prompt).toContain('Year 4')
  expect(prompt).toContain('Teach fractions')
  expect(prompt).toContain('Mixed ability')
})

it('never injects school name', () => {
  const prompt = buildEnrichedPrompt({
    resourceType: 'worksheet',
    input: 'Fractions worksheet',
    profile: baseProfile,
  })
  // schoolName is not even in the profile shape — this is a guard test
  expect(prompt).not.toContain('Greenfield')
  expect(prompt).not.toContain('St ')
})

it('skips empty profile fields', () => {
  const prompt = buildEnrichedPrompt({
    resourceType: 'quiz',
    input: 'Romans quiz',
    profile: { ...baseProfile, classProfile: '', outputStyle: '' },
  })
  expect(prompt).not.toContain('Class profile:')
  expect(prompt).not.toContain('Preferred style:')
})

it('includes year group always', () => {
  const prompt = buildEnrichedPrompt({
    resourceType: 'parent_email',
    input: 'Update on homework',
    profile: baseProfile,
  })
  expect(prompt).toContain('Year 4')
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run lib/chalkai/__tests__/promptEnricher.test.ts
```

Expected: fail with "Cannot find module".

- [ ] **Step 3: Implement promptEnricher.ts**

Create `lib/chalkai/promptEnricher.ts`:

```ts
import type { GenerateRequest, ResourceType } from '@/types'
import { buildTemplate as lessonPlan } from './templates/lessonPlan'
import { buildTemplate as worksheet } from './templates/worksheet'
import { buildTemplate as quiz } from './templates/quiz'
import { buildTemplate as parentLetter } from './templates/parentLetter'
import { buildTemplate as presentation } from './templates/presentation'

const SYSTEM_ROLES: Record<ResourceType, string> = {
  lesson_plan:  'You are an expert teaching assistant specialising in lesson design.',
  worksheet:    'You are an expert teaching assistant specialising in differentiated classroom resources.',
  quiz:         'You are an expert teaching assistant specialising in formative assessment.',
  parent_email: 'You are an expert teaching assistant specialising in school–home communication.',
  image:        'You are a creative illustrator producing educational images for classroom use.',
  presentation: 'You are an expert teaching assistant specialising in classroom presentations. You output only valid JSON.',
}

function templateFor(type: ResourceType): string {
  switch (type) {
    case 'lesson_plan':  return lessonPlan()
    case 'worksheet':    return worksheet()
    case 'quiz':         return quiz()
    case 'parent_email': return parentLetter()
    case 'presentation': return presentation()
    case 'image':        return ''
  }
}

export function buildEnrichedPrompt(req: GenerateRequest): string {
  const { resourceType, input, profile, resourceSpecificFields = {} } = req

  const contextLines: string[] = [
    `Year group: ${profile.yearGroup}`,
  ]
  if (profile.curriculum)       contextLines.push(`Curriculum: ${profile.curriculum}`)
  if (profile.subjectSpecialism) contextLines.push(`Subject specialism: ${profile.subjectSpecialism}`)
  if (profile.classProfile)     contextLines.push(`Class profile: ${profile.classProfile}`)
  if (profile.lessonLength)     contextLines.push(`Lesson length: ${profile.lessonLength}`)
  if (profile.outputStyle)      contextLines.push(`Preferred style: ${profile.outputStyle}`)

  const extraLines: string[] = []
  for (const [key, value] of Object.entries(resourceSpecificFields)) {
    if (value !== '' && value !== undefined && value !== null) {
      extraLines.push(`${key}: ${value}`)
    }
  }

  const parts = [
    `[SYSTEM ROLE]\n${SYSTEM_ROLES[resourceType]}`,
  ]

  const template = templateFor(resourceType)
  if (template) {
    parts.push(`[RESOURCE TEMPLATE]\n${template}`)
  }

  parts.push(
    `[TEACHER REQUEST + CONTEXT]\n${contextLines.join('\n')}${extraLines.length ? '\n' + extraLines.join('\n') : ''}\n\nTeacher's request: ${input}`
  )

  return parts.join('\n\n')
}

export function getSystemRole(type: ResourceType): string {
  return SYSTEM_ROLES[type]
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run lib/chalkai/__tests__/promptEnricher.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/chalkai/promptEnricher.ts lib/chalkai/__tests__/promptEnricher.test.ts
git commit -m "feat: add prompt enricher with unit tests"
```

---

## Task 5: OpenAI clients

**Files:**
- Create: `lib/chalkai/openaiClient.ts`
- Create: `lib/chalkai/openaiImageClient.ts`

- [ ] **Step 1: Create openaiClient.ts**

Create `lib/chalkai/openaiClient.ts`:

```ts
export interface TextResult {
  content: string
}

export interface JSONResult<T = unknown> {
  data: T
}

function getKey(): string {
  return process.env.OPENAI_API_KEY ?? ''
}

async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getKey()}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(`OpenAI ${res.status}: ${err.error?.message ?? 'Unknown error'}`)
  }

  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices[0]?.message?.content?.trim() ?? ''
}

export async function generateText(systemPrompt: string, userPrompt: string): Promise<TextResult> {
  const content = await callOpenAI(systemPrompt, userPrompt, 4000)
  return { content }
}

export async function generateJSON<T = unknown>(systemPrompt: string, userPrompt: string): Promise<JSONResult<T>> {
  const raw = await callOpenAI(systemPrompt, userPrompt, 6000)
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
  const data = JSON.parse(cleaned) as T
  return { data }
}

export function isConfigured(): boolean {
  return getKey().length > 10
}
```

- [ ] **Step 2: Create openaiImageClient.ts**

Create `lib/chalkai/openaiImageClient.ts`:

```ts
function getKey(): string {
  return process.env.OPENAI_API_KEY ?? ''
}

type Orientation = 'landscape' | 'portrait' | 'square'

function sizeFor(orientation: Orientation): string {
  switch (orientation) {
    case 'landscape': return '1792x1024'
    case 'portrait':  return '1024x1792'
    case 'square':    return '1024x1024'
  }
}

export async function generateImage(
  prompt: string,
  orientation: Orientation = 'square',
): Promise<{ base64: string; mimeType: 'image/png' }> {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getKey()}`,
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: sizeFor(orientation),
      response_format: 'b64_json',
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(`OpenAI images ${res.status}: ${err.error?.message ?? 'Unknown error'}`)
  }

  const data = await res.json() as { data: Array<{ b64_json: string }> }
  const base64 = data.data[0]?.b64_json
  if (!base64) throw new Error('No image data returned')

  return { base64, mimeType: 'image/png' }
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/chalkai/openaiClient.ts lib/chalkai/openaiImageClient.ts
git commit -m "feat: add OpenAI text and image clients"
```

---

## Task 6: Gemma stub + PPTX builder

**Files:**
- Create: `lib/chalkai/gemmaClient.ts`
- Create: `lib/chalkai/pptxBuilder.ts`

- [ ] **Step 1: Create gemmaClient.ts**

Create `lib/chalkai/gemmaClient.ts`:

```ts
export interface SlideContent {
  topic: string
  yearGroup: string
  themeDirection: string
  slideCount: number
  slides: Array<{
    type: 'title' | 'content' | 'image' | 'closing'
    title: string
    subtitle?: string
    bullets?: string[]
    speakerNotes: string
    imageDescription: string | null
  }>
}

export interface ThemedDeck {
  theme: {
    palette: string[]
    primaryFont: string
    accentFont: string
    backgroundStyle: 'solid' | 'gradient' | 'textured'
  }
  slides: Array<SlideContent['slides'][number] & { imageBase64?: string }>
}

function mockGemmaResponse(slideContent: SlideContent): ThemedDeck {
  return {
    theme: {
      palette: ['#0e0f0d', '#1a1a2e', '#e8a32a', '#ffffff', '#b0b0b0'],
      primaryFont: 'DM Sans',
      accentFont: 'Instrument Serif',
      backgroundStyle: 'gradient',
    },
    slides: slideContent.slides.map((slide) => ({
      ...slide,
      imageBase64: undefined,
    })),
  }
}

export async function themeAndIllustrate(slideContent: SlideContent): Promise<ThemedDeck> {
  const key = process.env.GEMMA_API_KEY
  if (!key) {
    return mockGemmaResponse(slideContent)
  }
  // Real Gemma implementation — add when API key is provided
  throw new Error('Gemma API not yet implemented — provide GEMMA_API_KEY')
}
```

- [ ] **Step 2: Create pptxBuilder.ts**

Create `lib/chalkai/pptxBuilder.ts`:

```ts
import pptxgen from 'pptxgenjs'
import type { ThemedDeck } from './gemmaClient'

export async function buildPptx(deck: ThemedDeck): Promise<string> {
  const pptx = new pptxgen()

  const [bg, , accent, text] = deck.theme.palette
  pptx.theme = { headFontFace: deck.theme.accentFont, bodyFontFace: deck.theme.primaryFont }

  for (const slide of deck.slides) {
    const s = pptx.addSlide()

    // Background colour
    s.background = { color: bg.replace('#', '') }

    if (slide.type === 'title') {
      s.addText(slide.title, {
        x: 0.5, y: 2.0, w: '90%', h: 1.2,
        fontSize: 36, bold: true, color: text.replace('#', ''),
        fontFace: deck.theme.accentFont, align: 'center',
      })
      if (slide.subtitle) {
        s.addText(slide.subtitle, {
          x: 0.5, y: 3.4, w: '90%', h: 0.6,
          fontSize: 18, color: accent.replace('#', ''),
          fontFace: deck.theme.primaryFont, align: 'center',
        })
      }
    } else if (slide.type === 'closing') {
      s.addText(slide.title, {
        x: 0.5, y: 2.4, w: '90%', h: 1.0,
        fontSize: 32, bold: true, color: accent.replace('#', ''),
        fontFace: deck.theme.accentFont, align: 'center',
      })
    } else if (slide.type === 'image' && slide.imageBase64) {
      s.addImage({
        data: `image/png;base64,${slide.imageBase64}`,
        x: 0, y: 0, w: '100%', h: '100%',
      })
      s.addText(slide.title, {
        x: 0.3, y: 0.2, w: '94%', h: 0.7,
        fontSize: 22, bold: true, color: text.replace('#', ''),
        fontFace: deck.theme.accentFont,
        shadow: { type: 'outer', color: '000000', blur: 4, offset: 2, angle: 45 },
      })
    } else {
      // content slide
      s.addText(slide.title, {
        x: 0.4, y: 0.3, w: '92%', h: 0.7,
        fontSize: 24, bold: true, color: accent.replace('#', ''),
        fontFace: deck.theme.accentFont,
      })

      const hasImage = slide.type === 'image' && slide.imageBase64
      const contentWidth = hasImage ? '55%' : '92%'

      if (slide.bullets && slide.bullets.length > 0) {
        const bulletText = slide.bullets.slice(0, 5).map((b) => ({
          text: b,
          options: { bullet: { type: 'bullet' as const }, fontSize: 16, color: text.replace('#', ''), paraSpaceAfter: 8 },
        }))
        s.addText(bulletText, {
          x: 0.4, y: 1.2, w: contentWidth, h: 4.0,
          fontFace: deck.theme.primaryFont, valign: 'top',
        })
      }

      if (slide.imageBase64) {
        s.addImage({
          data: `image/png;base64,${slide.imageBase64}`,
          x: '60%', y: 1.2, w: '36%', h: 3.6,
        })
      }
    }

    if (slide.speakerNotes) {
      s.addNotes(slide.speakerNotes)
    }
  }

  const base64 = await pptx.write({ outputType: 'base64' })
  return base64 as string
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/chalkai/gemmaClient.ts lib/chalkai/pptxBuilder.ts
git commit -m "feat: add Gemma stub and PPTX builder"
```

---

## Task 7: Model router

**Files:**
- Create: `lib/chalkai/modelRouter.ts`

- [ ] **Step 1: Create modelRouter.ts**

Create `lib/chalkai/modelRouter.ts`:

```ts
import type { GenerateRequest, GenerateResponse } from '@/types'
import { generateText, generateJSON, getSystemRole } from './openaiClient'
import { generateImage } from './openaiImageClient'
import { themeAndIllustrate, type SlideContent } from './gemmaClient'
import { buildPptx } from './pptxBuilder'
import { buildImagePrompt } from './templates/image'

export async function routeToModel(
  enrichedPrompt: string,
  req: GenerateRequest,
): Promise<Omit<GenerateResponse, 'piiFindings'>> {
  const { resourceType, input, profile, resourceSpecificFields = {} } = req

  switch (resourceType) {
    case 'lesson_plan':
    case 'worksheet':
    case 'quiz':
    case 'parent_email': {
      const systemRole = getSystemRole(resourceType)
      const { content } = await generateText(systemRole, enrichedPrompt)
      return { type: 'text', output: content, piiFindings: [] }
    }

    case 'image': {
      const intendedUse = (resourceSpecificFields.intendedUse as string) ?? 'scene'
      const orientation = (resourceSpecificFields.orientation as 'landscape' | 'portrait' | 'square') ?? 'square'
      const imagePrompt = buildImagePrompt(input, profile.yearGroup, intendedUse, orientation)
      const { base64 } = await generateImage(imagePrompt, orientation)
      return { type: 'image', output: base64, mimeType: 'image/png' }
    }

    case 'presentation': {
      const systemRole = getSystemRole('presentation')
      const { data } = await generateJSON<SlideContent>(systemRole, enrichedPrompt)
      const themedDeck = await themeAndIllustrate(data)
      const base64 = await buildPptx(themedDeck)
      const filename = `${data.topic.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-presentation.pptx`
      return { type: 'pptx', output: base64, filename }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/chalkai/modelRouter.ts
git commit -m "feat: add model router"
```

---

## Task 8: API route

**Files:**
- Create: `app/api/chalkai/generate/route.ts`

- [ ] **Step 1: Create the route**

Create `app/api/chalkai/generate/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import type { GenerateRequest, GenerateResponse } from '@/types'
import { scanForPII } from '@/lib/chalkai/piiScanner'
import { buildEnrichedPrompt } from '@/lib/chalkai/promptEnricher'
import { routeToModel } from '@/lib/chalkai/modelRouter'
import { isConfigured } from '@/lib/chalkai/openaiClient'

export async function POST(req: NextRequest): Promise<NextResponse<GenerateResponse>> {
  if (!isConfigured()) {
    return NextResponse.json(
      { type: 'error', error: 'API_KEY_NOT_CONFIGURED', message: 'Add OPENAI_API_KEY to .env.local to enable generation.' },
      { status: 503 },
    )
  }

  let body: GenerateRequest
  try {
    body = await req.json() as GenerateRequest
  } catch {
    return NextResponse.json(
      { type: 'error', error: 'GENERATION_FAILED', message: 'Invalid request body.' },
      { status: 400 },
    )
  }

  // PII scan
  const piiResult = scanForPII(body.input)

  if (piiResult.blocked) {
    return NextResponse.json({
      type: 'pii_blocked',
      piiFindings: piiResult.findings,
      sanitised: piiResult.sanitised,
    })
  }

  // Use sanitised input from here on
  const sanitisedBody: GenerateRequest = { ...body, input: piiResult.sanitised }

  const enrichedPrompt = buildEnrichedPrompt(sanitisedBody)

  try {
    const result = await routeToModel(enrichedPrompt, sanitisedBody)

    if (result.type === 'text') {
      return NextResponse.json({ ...result, piiFindings: piiResult.findings })
    }
    return NextResponse.json(result as GenerateResponse)
  } catch (err) {
    console.error('[chalkai/generate]', err)
    return NextResponse.json(
      { type: 'error', error: 'GENERATION_FAILED', message: err instanceof Error ? err.message : 'Generation failed.' },
      { status: 500 },
    )
  }
}
```

- [ ] **Step 2: Verify type-check passes**

```bash
cd "/Users/kotirobert/websites/arbor ai"
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/chalkai/generate/route.ts
git commit -m "feat: add /api/chalkai/generate route"
```

---

## Task 9: PIIWarningBanner + LoadingState components

**Files:**
- Create: `components/chalkai/PIIWarningBanner.tsx`
- Create: `components/chalkai/LoadingState.tsx`

- [ ] **Step 1: Create PIIWarningBanner.tsx**

Create `components/chalkai/PIIWarningBanner.tsx`:

```tsx
'use client'

import type { PIIFinding } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  findings: PIIFinding[]
  onEdit: () => void
  onContinue?: () => void
}

const TYPE_LABELS: Record<string, string> = {
  studentName: 'student name',
  staffName:   'staff name',
  schoolName:  'school name',
  email:       'email address',
  phone:       'phone number',
  postcode:    'postcode',
}

export function PIIWarningBanner({ findings, onEdit, onContinue }: Props) {
  const isBlocked = findings.some((f) => f.severity === 'block')

  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 text-[13px]',
        isBlocked
          ? 'border-red-500/30 bg-red-500/10 text-red-300'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-200',
      )}
    >
      <div className="mb-2 flex items-center gap-2 font-semibold">
        <span>{isBlocked ? '🔒' : '⚠️'}</span>
        <span>
          {isBlocked
            ? 'Personal data detected — please remove before sending to AI'
            : 'We spotted personal information and replaced it to keep things GDPR-safe'}
        </span>
      </div>

      <ul className="mb-3 space-y-1 pl-1 text-[12px] opacity-90">
        {findings.map((f, i) => (
          <li key={i}>
            {isBlocked
              ? `Found ${TYPE_LABELS[f.type] ?? f.type}: "${f.match}" — please remove this before continuing.`
              : `"${f.match}" looks like a ${TYPE_LABELS[f.type] ?? f.type} — replaced with ${f.type === 'studentName' ? '[STUDENT]' : f.type === 'staffName' ? '[STAFF]' : '[REDACTED]'}.`}
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="rounded-full border border-current px-3 py-1 text-[12px] font-medium opacity-90 hover:opacity-100"
        >
          Edit prompt
        </button>
        {!isBlocked && onContinue && (
          <button
            onClick={onContinue}
            className="rounded-full bg-amber-500 px-3 py-1 text-[12px] font-medium text-[#0e0f0d] hover:bg-amber-400"
          >
            Continue with redactions
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create LoadingState.tsx**

Create `components/chalkai/LoadingState.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import type { ResourceType } from '@/types'

interface Props {
  resourceType: ResourceType
}

const TEXT_TIPS = [
  'Thinking about your class…',
  'Structuring the content…',
  'Applying differentiation…',
  'Adding assessment ideas…',
  'Polishing the output…',
]

const PRESENTATION_STEPS = [
  'Checking your prompt…',
  'Writing slide content…',
  'Designing theme & generating visuals…',
  'Assembling presentation…',
]

export function LoadingState({ resourceType }: Props) {
  const [tipIndex, setTipIndex] = useState(0)
  const [step, setStep]         = useState(0)

  useEffect(() => {
    if (resourceType === 'presentation') {
      const timer = setInterval(() => setStep((s) => Math.min(s + 1, PRESENTATION_STEPS.length - 1)), 4000)
      return () => clearInterval(timer)
    }
    const timer = setInterval(() => setTipIndex((i) => (i + 1) % TEXT_TIPS.length), 2500)
    return () => clearInterval(timer)
  }, [resourceType])

  if (resourceType === 'presentation') {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10">
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {PRESENTATION_STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                  i < step
                    ? 'bg-[var(--green)] text-[#0e0f0d]'
                    : i === step
                    ? 'bg-[var(--amber)] text-[#0e0f0d]'
                    : 'bg-[var(--surface3)] text-[var(--ink3)]'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span
                className={`text-[13px] transition-all ${
                  i === step ? 'text-[var(--ink)] font-medium' : i < step ? 'text-[var(--ink3)] line-through' : 'text-[var(--ink3)]'
                }`}
              >
                {label}
                {i === step && <span className="ml-1 animate-pulse">…</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border2)] border-t-[var(--amber)]" />
      <p className="text-[13px] text-[var(--ink2)] transition-all">{TEXT_TIPS[tipIndex]}</p>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/chalkai/PIIWarningBanner.tsx components/chalkai/LoadingState.tsx
git commit -m "feat: add PIIWarningBanner and LoadingState components"
```

---

## Task 10: Update GeneratorForm (all 6 resource types)

**Files:**
- Modify: `components/chalkai/GeneratorForm.tsx`

- [ ] **Step 1: Replace GeneratorForm.tsx**

Replace the entire contents of `components/chalkai/GeneratorForm.tsx`:

```tsx
'use client'

import { useMemo, useState, useEffect } from 'react'
import type { ResourceType, TeacherProfile, GenerateFormInput } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  type:       ResourceType
  profile:    TeacherProfile | null
  onGenerate: (input: GenerateFormInput) => void
}

const YEAR_GROUPS  = ['Reception', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11']
const DURATIONS    = ['30 mins', '45 mins', '60 mins', '90 mins']
const SUBJECTS     = ['Maths', 'English', 'Science', 'History', 'Geography', 'RE', 'Computing', 'Art', 'PE', 'PSHE']
const TONES        = ['Professional • Warm', 'Concise', 'Reassuring', 'Firm but fair']
const PURPOSES     = ['Behaviour update', 'Homework concern', 'Progress celebration', 'Upcoming trip', 'General update']
const INTENDED_USE = ['poster', 'diagram', 'display', 'scene'] as const
const ORIENTATIONS = ['landscape', 'portrait', 'square'] as const

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink3)]">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-[var(--ink3)]">{hint}</span>}
    </label>
  )
}

const inputCls    = 'h-10 rounded-lg border border-[var(--border2)] bg-[var(--surface2)] px-3 text-[13px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink3)] focus:border-[var(--amber-border)]'
const textareaCls = 'rounded-lg border border-[var(--border2)] bg-[var(--surface2)] px-3 py-2 text-[13px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink3)] focus:border-[var(--amber-border)]'

export function GeneratorForm({ type, profile, onGenerate }: Props) {
  const defaultYear     = profile?.yearGroups?.[0] ?? 'Year 4'
  const defaultSubject  = profile?.subjects?.[0] ?? 'Maths'
  const defaultDuration = profile?.lessonLength ? `${profile.lessonLength} mins` : '45 mins'

  const defaultSlideCount = useMemo(() => {
    if (!profile?.lessonLength) return 8
    const mins = parseInt(profile.lessonLength, 10)
    return Math.min(20, Math.max(5, Math.round(mins / 6)))
  }, [profile])

  const [topic, setTopic]             = useState('')
  const [yearGroup, setYearGroup]     = useState(defaultYear)
  const [subject, setSubject]         = useState(defaultSubject)
  const [duration, setDuration]       = useState(defaultDuration)
  const [notes, setNotes]             = useState('')
  const [tone, setTone]               = useState(TONES[0])
  const [purpose, setPurpose]         = useState(PURPOSES[0])
  const [numQuestions, setNumQ]       = useState('10')
  const [intendedUse, setIntendedUse] = useState<typeof INTENDED_USE[number]>('scene')
  const [orientation, setOrientation] = useState<typeof ORIENTATIONS[number]>('landscape')
  const [objectives, setObjectives]   = useState('')
  const [slideCount, setSlideCount]   = useState(defaultSlideCount)
  const [speakerNotes, setSpeakerNotes] = useState(true)

  useEffect(() => { setTopic('') }, [type])

  const valid = topic.trim().length > 0

  const handleSubmit = () => {
    if (!valid) return
    const base: GenerateFormInput = { resourceType: type, topic, yearGroup, subject, duration, notes }
    if (type === 'quiz')         base.numQuestions = numQuestions
    if (type === 'parent_email') { base.tone = tone; base.purpose = purpose }
    if (type === 'image')        { base.intendedUse = intendedUse; base.orientation = orientation }
    if (type === 'presentation') { base.objectives = objectives; base.slideCount = slideCount; base.speakerNotes = speakerNotes }
    onGenerate(base)
  }

  const title = useMemo(() => {
    switch (type) {
      case 'lesson_plan':  return 'Lesson plan details'
      case 'worksheet':    return 'Worksheet details'
      case 'quiz':         return 'Quiz details'
      case 'parent_email': return 'Email details'
      case 'image':        return 'Image details'
      case 'presentation': return 'Presentation details'
    }
  }, [type])

  const topicPlaceholder = useMemo(() => {
    switch (type) {
      case 'parent_email': return 'e.g. Homework focus this half-term'
      case 'image':        return 'e.g. Cross-section of a plant cell with labelled parts'
      case 'presentation': return 'e.g. The Water Cycle — Year 5 Science'
      default:             return 'e.g. Fractions — halves and quarters'
    }
  }, [type])

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-[var(--ink3)]">Step 2</div>
        <h3 className="font-display text-[18px] font-medium text-[var(--ink)]">{title}</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label={type === 'image' ? 'Description' : 'Topic'}>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={topicPlaceholder}
            className={inputCls}
            autoFocus
          />
        </Field>

        {type !== 'image' && (
          <Field label="Year group">
            <select value={yearGroup} onChange={(e) => setYearGroup(e.target.value)} className={cn(inputCls, 'appearance-none pr-8')}>
              {YEAR_GROUPS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>
        )}

        {(type === 'lesson_plan' || type === 'worksheet' || type === 'quiz' || type === 'presentation') && (
          <Field label="Subject">
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className={cn(inputCls, 'appearance-none pr-8')}>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        )}

        {(type === 'lesson_plan' || type === 'worksheet') && (
          <Field label="Lesson length">
            <select value={duration} onChange={(e) => setDuration(e.target.value)} className={cn(inputCls, 'appearance-none pr-8')}>
              {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
        )}

        {type === 'quiz' && (
          <>
            <Field label="Time allowed">
              <select value={duration} onChange={(e) => setDuration(e.target.value)} className={cn(inputCls, 'appearance-none pr-8')}>
                {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Number of questions">
              <input type="number" min={4} max={12} value={numQuestions} onChange={(e) => setNumQ(e.target.value)} className={inputCls} />
            </Field>
          </>
        )}

        {type === 'parent_email' && (
          <>
            <Field label="Purpose">
              <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className={cn(inputCls, 'appearance-none pr-8')}>
                {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Tone">
              <select value={tone} onChange={(e) => setTone(e.target.value)} className={cn(inputCls, 'appearance-none pr-8')}>
                {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </>
        )}

        {type === 'image' && (
          <>
            <Field label="Intended use">
              <select value={intendedUse} onChange={(e) => setIntendedUse(e.target.value as typeof INTENDED_USE[number])} className={cn(inputCls, 'appearance-none pr-8')}>
                {INTENDED_USE.map((u) => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
              </select>
            </Field>
            <Field label="Orientation">
              <div className="flex gap-3 pt-1">
                {ORIENTATIONS.map((o) => (
                  <label key={o} className="flex cursor-pointer items-center gap-1.5 text-[13px] text-[var(--ink)]">
                    <input
                      type="radio"
                      name="orientation"
                      value={o}
                      checked={orientation === o}
                      onChange={() => setOrientation(o)}
                      className="accent-[var(--amber)]"
                    />
                    {o.charAt(0).toUpperCase() + o.slice(1)}
                  </label>
                ))}
              </div>
            </Field>
          </>
        )}

        {type === 'presentation' && (
          <>
            <Field label="Slide count (5–20)">
              <input
                type="number"
                min={5}
                max={20}
                value={slideCount}
                onChange={(e) => setSlideCount(Math.min(20, Math.max(5, parseInt(e.target.value, 10) || 8)))}
                className={inputCls}
              />
            </Field>
            <Field label="Speaker notes">
              <label className="flex cursor-pointer items-center gap-2 pt-2 text-[13px] text-[var(--ink)]">
                <input
                  type="checkbox"
                  checked={speakerNotes}
                  onChange={(e) => setSpeakerNotes(e.target.checked)}
                  className="accent-[var(--amber)] h-4 w-4"
                />
                Include speaker notes
              </label>
            </Field>
          </>
        )}
      </div>

      {type === 'presentation' && (
        <Field label="Key learning objectives">
          <textarea
            rows={2}
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            placeholder="e.g. Pupils will understand the stages of the water cycle and explain evaporation."
            className={textareaCls}
          />
        </Field>
      )}

      {type !== 'image' && (
        <Field
          label="Notes (optional)"
          hint={profile ? `Draws on your profile: ${profile.yearGroups.slice(0, 2).join(', ')} · ${profile.curriculum} · ${profile.outputStyle} style.` : undefined}
        >
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Class context, SEND needs, vocabulary, prior learning…"
            className={textareaCls}
          />
        </Field>
      )}

      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--ink3)]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          GDPR-safe prompt
        </div>
        <button
          onClick={handleSubmit}
          disabled={!valid}
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform',
            valid
              ? 'bg-[var(--amber)] text-[#0e0f0d] hover:scale-[1.02]'
              : 'cursor-not-allowed bg-[var(--surface3)] text-[var(--ink3)]',
          )}
        >
          Generate
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/chalkai/GeneratorForm.tsx
git commit -m "feat: extend GeneratorForm for image and presentation resource types"
```

---

## Task 11: Update GeneratorPanel (wire to API)

**Files:**
- Modify: `components/chalkai/GeneratorPanel.tsx`

- [ ] **Step 1: Replace GeneratorPanel.tsx**

Replace the entire contents of `components/chalkai/GeneratorPanel.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { RESOURCE_TYPES } from '@/lib/chalkai/resourceTemplates'
import { ResourceTypeCard } from './ResourceTypeCard'
import { GeneratorForm } from './GeneratorForm'
import { ResourceOutput } from './ResourceOutput'
import { PIIWarningBanner } from './PIIWarningBanner'
import { LoadingState } from './LoadingState'
import type {
  ResourceType, TeacherProfile, SavedResource,
  GenerateFormInput, GenerateResponse, PIIFinding,
} from '@/types'

interface Props {
  profile: TeacherProfile | null
}

type PanelState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'pii_blocked'; findings: PIIFinding[]; sanitised: string }
  | { status: 'done'; response: GenerateResponse & { type: 'text' | 'image' | 'pptx' }; piiFindings?: PIIFinding[]; formInput: GenerateFormInput }
  | { status: 'error'; message: string; isKeyMissing: boolean }

const HISTORY_KEY = 'chalkai-history'

function appendHistory(r: SavedResource) {
  if (typeof window === 'undefined') return
  try {
    const raw  = window.localStorage.getItem(HISTORY_KEY)
    const list: SavedResource[] = raw ? JSON.parse(raw) : []
    list.unshift(r)
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 50)))
  } catch { /* noop */ }
}

function profileToRequestProfile(p: TeacherProfile | null, yearGroup: string) {
  return {
    curriculum:       p?.curriculum    ?? '',
    yearGroup,
    subjectSpecialism: p?.subjects?.[0] ?? '',
    classProfile:     p?.classProfile?.join(', ') ?? '',
    lessonLength:     p?.lessonLength  ?? '',
    outputStyle:      p?.outputStyle   ?? '',
  }
}

export function GeneratorPanel({ profile }: Props) {
  const [selected, setSelected] = useState<ResourceType>('lesson_plan')
  const [state, setState]       = useState<PanelState>({ status: 'idle' })
  const [saved, setSaved]       = useState(false)
  const [lastInput, setLastInput] = useState<GenerateFormInput | null>(null)

  const handleGenerate = async (input: GenerateFormInput) => {
    setLastInput(input)
    setState({ status: 'loading' })

    const body = {
      resourceType: input.resourceType,
      input: input.topic,
      profile: profileToRequestProfile(profile, input.yearGroup),
      resourceSpecificFields: {
        subject:      input.subject      ?? '',
        duration:     input.duration     ?? '',
        notes:        input.notes        ?? '',
        numQuestions: input.numQuestions ?? '',
        tone:         input.tone         ?? '',
        purpose:      input.purpose      ?? '',
        intendedUse:  input.intendedUse  ?? '',
        orientation:  input.orientation  ?? '',
        objectives:   input.objectives   ?? '',
        slideCount:   input.slideCount   ?? 8,
        speakerNotes: input.speakerNotes ?? true,
      },
    }

    try {
      const res  = await fetch('/api/chalkai/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json() as GenerateResponse

      if (data.type === 'pii_blocked') {
        setState({ status: 'pii_blocked', findings: data.piiFindings, sanitised: data.sanitised })
        return
      }
      if (data.type === 'error') {
        setState({
          status: 'error',
          message: data.message,
          isKeyMissing: data.error === 'API_KEY_NOT_CONFIGURED',
        })
        return
      }
      setState({
        status: 'done',
        response: data as GenerateResponse & { type: 'text' | 'image' | 'pptx' },
        piiFindings: data.type === 'text' ? data.piiFindings : [],
        formInput: input,
      })
      setSaved(false)
    } catch {
      setState({ status: 'error', message: 'Network error — please try again.', isKeyMissing: false })
    }
  }

  const handleSave = () => {
    if (state.status !== 'done' || !lastInput) return
    const { response } = state
    const content = response.type === 'text' ? response.output : response.output
    const rec: SavedResource = {
      id:        `res-${Date.now()}`,
      type:      selected,
      title:     lastInput.topic,
      topic:     lastInput.topic,
      yearGroup: lastInput.yearGroup,
      subject:   lastInput.subject,
      content,
      createdAt: new Date().toISOString(),
    }
    appendHistory(rec)
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl flex-col px-4 pb-6 pt-4 md:flex-row md:gap-5 md:px-6">
      {/* Left: type picker + form */}
      <div className="flex w-full flex-col gap-5 md:w-[440px] md:flex-shrink-0">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-[var(--ink3)]">Step 1</div>
          <h3 className="font-display text-[18px] font-medium text-[var(--ink)]">Choose a resource</h3>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {RESOURCE_TYPES.map((rt) => (
              <ResourceTypeCard
                key={rt.type}
                meta={rt}
                selected={selected === rt.type}
                onClick={() => { setSelected(rt.type); setState({ status: 'idle' }) }}
              />
            ))}
          </div>
        </div>

        <div className="chalkai-divider" />

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          {state.status === 'pii_blocked' && (
            <PIIWarningBanner
              findings={state.findings}
              onEdit={() => setState({ status: 'idle' })}
            />
          )}
          {state.status !== 'pii_blocked' && (
            <GeneratorForm
              type={selected}
              profile={profile}
              onGenerate={handleGenerate}
            />
          )}
        </div>
      </div>

      {/* Right: output */}
      <div className="mt-5 min-h-[520px] flex-1 md:mt-0 md:min-h-[680px]">
        {state.status === 'loading' && <LoadingState resourceType={selected} />}

        {state.status === 'error' && (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--border2)] bg-[var(--surface)]/40 p-10 text-center">
            {state.isKeyMissing ? (
              <>
                <div className="text-[13px] font-medium text-[var(--amber)]">OpenAI API key not configured</div>
                <p className="max-w-sm text-[12px] text-[var(--ink3)]">
                  Add <code className="rounded bg-[var(--surface3)] px-1.5 py-0.5">OPENAI_API_KEY</code> to{' '}
                  <code className="rounded bg-[var(--surface3)] px-1.5 py-0.5">.env.local</code> to enable generation.
                </p>
              </>
            ) : (
              <>
                <div className="text-[13px] font-medium text-red-400">Generation failed</div>
                <p className="max-w-sm text-[12px] text-[var(--ink3)]">{state.message}</p>
              </>
            )}
          </div>
        )}

        {state.status === 'done' && (
          <div className="flex h-full flex-col gap-3">
            {state.piiFindings && state.piiFindings.length > 0 && (
              <PIIWarningBanner
                findings={state.piiFindings}
                onEdit={() => setState({ status: 'idle' })}
                onContinue={() => {
                  if (state.status === 'done') {
                    setState({ ...state, piiFindings: [] })
                  }
                }}
              />
            )}
            <ResourceOutput
              response={state.response}
              topic={lastInput?.topic ?? ''}
              onSave={handleSave}
              saved={saved}
            />
          </div>
        )}

        {state.status === 'idle' && <EmptyOutput />}
        {state.status === 'pii_blocked' && <EmptyOutput />}
      </div>
    </div>
  )
}

function EmptyOutput() {
  return (
    <div className="flex h-full min-h-[520px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border2)] bg-[var(--surface)]/40 p-10 text-center">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border2)] bg-[var(--surface)]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v18M3 12h18" />
        </svg>
      </div>
      <h3 className="font-serif text-[22px] italic text-[var(--ink)]">Your draft appears here</h3>
      <p className="mt-2 max-w-sm text-[13px] text-[var(--ink2)]">
        Pick a resource type, fill in topic and year group, and press <span className="font-medium text-[var(--ink)]">Generate</span>. You can save to history afterwards.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Verify type-check**

```bash
npm run type-check
```

Expected: no errors (ResourceOutput props will differ — that gets fixed in Task 12).

- [ ] **Step 3: Commit after Task 12 passes type-check**

Hold this commit until ResourceOutput is updated.

---

## Task 12: Update ResourceOutput (image + PPTX output)

**Files:**
- Modify: `components/chalkai/ResourceOutput.tsx`

- [ ] **Step 1: Replace ResourceOutput.tsx**

Replace the entire contents of `components/chalkai/ResourceOutput.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { streamText } from '@/lib/chalkai/mockAssistant'
import { RefinementBar } from './RefinementBar'
import type { GenerateResponse } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  response: GenerateResponse & { type: 'text' | 'image' | 'pptx' }
  topic:    string
  onSave:   () => void
  saved?:   boolean
}

function renderInline(md: string): string {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\s)_(.+?)_(?=\s|$)/g, '$1<em class="text-[var(--ink2)]">$2</em>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-[var(--surface3)] px-1.5 py-0.5 text-[0.85em]">$1</code>')
}

function renderBlocks(md: string): string {
  const lines = md.split('\n')
  const out: string[] = []
  let inUl = false, inOl = false
  const closeLists = () => {
    if (inUl) { out.push('</ul>'); inUl = false }
    if (inOl) { out.push('</ol>'); inOl = false }
  }
  for (const raw of lines) {
    const line = raw.trimEnd()
    if (/^[-*]\s+/.test(line)) {
      if (!inUl) { closeLists(); out.push('<ul class="my-2 list-disc space-y-1.5 pl-5 text-[var(--ink)]">'); inUl = true }
      out.push(`<li>${renderInline(line.replace(/^[-*]\s+/, ''))}</li>`)
    } else if (/^\d+\.\s+/.test(line)) {
      if (!inOl) { closeLists(); out.push('<ol class="my-2 list-decimal space-y-1.5 pl-5 text-[var(--ink)]">'); inOl = true }
      out.push(`<li>${renderInline(line.replace(/^\d+\.\s+/, ''))}</li>`)
    } else if (/^#\s+/.test(line))  { closeLists(); out.push(`<h1 class="mt-4 mb-2 font-serif text-[24px] italic text-[var(--ink)]">${renderInline(line.replace(/^#\s+/, ''))}</h1>`) }
    else if (/^##\s+/.test(line))   { closeLists(); out.push(`<h2 class="mt-5 mb-2 font-display text-[15px] font-semibold uppercase tracking-wider text-[var(--amber)]">${renderInline(line.replace(/^##\s+/, ''))}</h2>`) }
    else if (/^###\s+/.test(line))  { closeLists(); out.push(`<h3 class="mt-3 mb-1 font-display text-[13px] font-semibold text-[var(--ink)]">${renderInline(line.replace(/^###\s+/, ''))}</h3>`) }
    else if (/^---+$/.test(line))   { closeLists(); out.push('<hr class="my-4 border-t border-[var(--border)]" />') }
    else if (line === '')            { closeLists(); out.push('<div class="h-2"></div>') }
    else                             { closeLists(); out.push(`<p class="leading-relaxed text-[var(--ink)]">${renderInline(line)}</p>`) }
  }
  closeLists()
  return out.join('')
}

function downloadBlob(base64: string, filename: string, mimeType: string) {
  const bytes  = atob(base64)
  const arr    = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  const blob   = new Blob([arr], { type: mimeType })
  const url    = URL.createObjectURL(blob)
  const a      = document.createElement('a')
  a.href       = url
  a.download   = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ResourceOutput({ response, topic, onSave, saved }: Props) {
  const [streamed, setStreamed]     = useState('')
  const [streaming, setStreaming]   = useState(false)
  const [copied, setCopied]         = useState(false)

  useEffect(() => {
    if (response.type !== 'text') { setStreaming(false); return }
    setStreamed('')
    setStreaming(true)
    const stop = streamText(response.output, (s) => setStreamed(s), () => setStreaming(false), 6)
    return stop
  }, [response])

  const handleCopy = () => {
    if (response.type === 'text' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(response.output).catch(() => {})
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  if (response.type === 'image') {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-[var(--ink3)]">Generated Image</div>
            <h3 className="font-serif text-[22px] italic text-[var(--ink)]">{topic}</h3>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <img
            src={`data:${response.mimeType};base64,${response.output}`}
            alt={topic}
            className="max-h-[480px] max-w-full rounded-xl object-contain shadow-lg"
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          <button
            onClick={() => downloadBlob(response.output, `${topic.replace(/[^a-z0-9]/gi, '-')}.png`, response.mimeType)}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--amber)] px-4 py-2 text-[13px] font-semibold text-[#0e0f0d] hover:scale-[1.02] transition-transform"
          >
            Download PNG
          </button>
          <button onClick={onSave} className="rounded-full border border-[var(--border2)] px-4 py-2 text-[13px] text-[var(--ink2)] hover:text-[var(--ink)]">
            {saved ? 'Saved ✓' : 'Save to history'}
          </button>
        </div>
      </div>
    )
  }

  if (response.type === 'pptx') {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-[var(--ink3)]">Presentation</div>
            <h3 className="font-serif text-[22px] italic text-[var(--ink)]">{topic}</h3>
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border2)] bg-[var(--surface2)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-[var(--ink)]">Your presentation is ready</p>
            <p className="mt-1 text-[12px] text-[var(--ink3)]">{response.filename}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          <button
            onClick={() => downloadBlob(response.output, response.filename, 'application/vnd.openxmlformats-officedocument.presentationml.presentation')}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--amber)] px-4 py-2 text-[13px] font-semibold text-[#0e0f0d] hover:scale-[1.02] transition-transform"
          >
            Download .pptx
          </button>
          <button onClick={onSave} className="rounded-full border border-[var(--border2)] px-4 py-2 text-[13px] text-[var(--ink2)] hover:text-[var(--ink)]">
            {saved ? 'Saved ✓' : 'Save to history'}
          </button>
        </div>
      </div>
    )
  }

  // Text output
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div className="min-w-0">
          <h3 className="truncate font-serif text-[22px] italic text-[var(--ink)]">{topic}</h3>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[var(--ink3)]">
          {streaming ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--amber)]" />
              Drafting
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
              Ready
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div
          className={cn('max-w-none text-[13.5px]', streaming && 'caret')}
          dangerouslySetInnerHTML={{ __html: renderBlocks(streamed || response.output) }}
        />
      </div>
      <RefinementBar onRefine={() => {}} onCopy={handleCopy} onSave={onSave} copied={copied} saved={saved} />
    </div>
  )
}
```

- [ ] **Step 2: Verify type-check passes**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit Tasks 11 + 12 together**

```bash
git add components/chalkai/GeneratorPanel.tsx components/chalkai/ResourceOutput.tsx
git commit -m "feat: wire GeneratorPanel to API, update ResourceOutput for image and pptx"
```

---

## Task 13: Update RESOURCE_TYPES + retire mockOutputFor

**Files:**
- Modify: `lib/chalkai/resourceTemplates.ts`

The RESOURCE_TYPES array drives the resource type picker grid. Add image and presentation entries. Remove `mockOutputFor` and `GeneratorInput` (no longer used).

- [ ] **Step 1: Replace resourceTemplates.ts**

Replace the entire contents of `lib/chalkai/resourceTemplates.ts`:

```ts
import type { ResourceType } from '@/types'

export interface ResourceTypeMeta {
  type:    ResourceType
  title:   string
  subtitle: string
  accent:  string
  cssVar:  string
  icon:    string
}

export const RESOURCE_TYPES: ResourceTypeMeta[] = [
  {
    type: 'lesson_plan',
    title: 'Lesson Plan',
    subtitle: 'Starter → main → plenary with differentiation',
    accent: 'amber',
    cssVar: '--amber',
    icon: 'lesson',
  },
  {
    type: 'worksheet',
    title: 'Worksheet',
    subtitle: 'Tiered tasks, extension, and answer key',
    accent: 'green',
    cssVar: '--green',
    icon: 'worksheet',
  },
  {
    type: 'quiz',
    title: 'Quiz',
    subtitle: 'Recall → apply → extended with mark scheme',
    accent: 'gold',
    cssVar: '--gold',
    icon: 'quiz',
  },
  {
    type: 'parent_email',
    title: 'Parent Email',
    subtitle: 'Professional, warm, under 250 words',
    accent: 'blue',
    cssVar: '--blue',
    icon: 'email',
  },
  {
    type: 'image',
    title: 'Image',
    subtitle: 'Educational illustration generated by AI',
    accent: 'amber',
    cssVar: '--amber',
    icon: 'image',
  },
  {
    type: 'presentation',
    title: 'Presentation',
    subtitle: 'Slide deck built and themed automatically',
    accent: 'green',
    cssVar: '--green',
    icon: 'presentation',
  },
]

export function metaFor(type: ResourceType): ResourceTypeMeta {
  return RESOURCE_TYPES.find((r) => r.type === type)!
}
```

- [ ] **Step 2: Final type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Run all unit tests**

```bash
npx vitest run
```

Expected: 12 tests pass (8 piiScanner + 4 promptEnricher).

- [ ] **Step 4: Final commit**

```bash
git add lib/chalkai/resourceTemplates.ts
git commit -m "feat: retire mockOutputFor, add image and presentation to resource type picker"
```

---

## Post-build: Manual verification checklist

Once `OPENAI_API_KEY` is added to `.env.local`, run `npm run dev` and verify:

- [ ] Lesson plan generates real markdown output
- [ ] Worksheet generates real markdown output
- [ ] Quiz generates real markdown output
- [ ] Parent email generates real markdown output
- [ ] Typing "Tommy struggles with fractions" shows PII warning banner before generating
- [ ] Typing an email address blocks generation
- [ ] Image generator returns downloadable PNG
- [ ] Presentation with mock Gemma produces a downloadable .pptx file that opens in PowerPoint/Keynote
- [ ] No-key state shows amber "API key not configured" notice (test by removing key temporarily)
