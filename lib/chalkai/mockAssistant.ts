import type { TeacherProfile } from '@/types'

export interface MockReply {
  kind:     'clarify' | 'resource' | 'text'
  title?:   string
  body:     string
  options?: string[]
}

const CLARIFIES = [
  {
    trigger: /^(help|something on|generate|make|create)/i,
    reply:   (): MockReply => ({
      kind: 'clarify',
      body: 'Happy to help \u2014 what kind of resource are you after?',
      options: ['Lesson plan', 'Worksheet', 'Quiz', 'Parent email'],
    }),
  },
]

const SLASH_REPLIES: Record<string, (profile: TeacherProfile | null, tail: string) => MockReply> = {
  '/bloom': (_p, tail) => ({
    kind: 'text',
    title: 'Bloom\u2019s taxonomy pass',
    body: `Here are six Bloom-laddered questions${tail ? ` on **${tail.trim()}**` : ''}:

**Remember** \u2014 Name three key features.
**Understand** \u2014 In your own words, explain why the second feature matters.
**Apply** \u2014 Use these ideas to solve a new example.
**Analyse** \u2014 Compare two examples and say which is stronger. Why?
**Evaluate** \u2014 Which approach is most useful in a real-world setting?
**Create** \u2014 Design your own example and justify your choices.`,
  }),

  '/retrieval': (_p, tail) => ({
    kind: 'text',
    title: '5-minute retrieval starter',
    body: `Pupils answer on whiteboards, teacher does cold-call pickup:

1. ${tail ? `Define ${tail.trim()} in one sentence.` : 'Define the key term from last lesson.'}
2. Give one real-world example.
3. True or false: [misconception-based statement] \u2014 explain your answer.
4. What was the key step we practised yesterday?
5. Predict: what would happen if we changed the first condition?

_Repeat the weakest question next lesson as a warm-up._`,
  }),

  '/differentiate': (_p, tail) => ({
    kind: 'text',
    title: `Differentiated versions${tail ? ` \u2014 ${tail.trim()}` : ''}`,
    body: `**Support**
Sentence starters, worked example on desk, reduced to 3 questions, paired talk first.

**Expected**
Standard 5-question task, access to vocabulary bank, peer check at question 3.

**Challenge**
Open-ended prompt requiring justification, no scaffolding, extension to a transfer task.`,
  }),

  '/exit-ticket': (_p, tail) => ({
    kind: 'text',
    title: `Exit ticket${tail ? ` \u2014 ${tail.trim()}` : ''}`,
    body: `Three questions, 3 minutes, collect as pupils leave:

1. One thing I learned today \u2026
2. One question I still have \u2026
3. A quick check: [subject-specific question tied to today\u2019s LO].`,
  }),

  '/hinge': (_p, tail) => ({
    kind: 'text',
    title: `Hinge question${tail ? ` \u2014 ${tail.trim()}` : ''}`,
    body: `Use at the mid-point. All pupils show answer simultaneously (fingers / mini-whiteboards).

> Which of these best describes ${tail ? tail.trim() : 'the key concept'}?
>
> **A** \u2014 common misconception
> **B** \u2014 correct answer
> **C** \u2014 partially correct / near-miss
> **D** \u2014 off-topic distractor

If fewer than 80% pick **B**, pause and re-teach before moving on.`,
  }),

  '/success-criteria': (_p, tail) => ({
    kind: 'text',
    title: 'Success criteria',
    body: `**I can${tail ? ` \u2026 on ${tail.trim()}` : ''}:**

- identify the key ideas and use the correct vocabulary
- explain my reasoning with an example
- apply what I’ve learned to a question I haven’t seen before`,
  }),
}

const KEYWORD_REPLIES: { trigger: RegExp; reply: (profile: TeacherProfile | null) => MockReply }[] = [
  {
    trigger: /lesson plan|lesson for/i,
    reply: (p) => ({
      kind: 'resource',
      title: 'Lesson Plan',
      body: `Nice. I’ll put together a full plan \u2014 switch to the **Generator** tab on the top-right and pick **Lesson Plan** to fill in topic, year group and any class-specific notes.

Or keep chatting here and tell me the topic + year group in one line and I’ll draft it inline. For example: *“fractions for year 4, 45 mins, mixed ability”*.${p ? `\n\nI’ll use your profile: ${p.yearGroups.slice(0, 2).join(', ')} \u00b7 ${p.curriculum} \u00b7 ${p.outputStyle} style.` : ''}`,
    }),
  },
  {
    trigger: /worksheet/i,
    reply: () => ({
      kind: 'resource',
      title: 'Worksheet',
      body: `Sure \u2014 tell me the topic and year group. I’ll structure it as **Warm up \u2192 Main tasks \u2192 Challenge \u2192 Reflection** and match the difficulty to your class profile.`,
    }),
  },
  {
    trigger: /quiz/i,
    reply: () => ({
      kind: 'resource',
      title: 'Quiz',
      body: `Happy to. Should this be a retrieval quiz (10 short questions) or an assessment (10 questions building to an extended response)?`,
    }),
  },
  {
    trigger: /parent|email|message/i,
    reply: () => ({
      kind: 'resource',
      title: 'Parent Email',
      body: `What’s the message for? Behaviour update, upcoming trip, homework concern, progress celebration? I’ll keep it under 250 words with home-support tips.`,
    }),
  },
  {
    trigger: /attendance|risk|pupil|year 3|year 4|year 5|year 6|boys?|girls?/i,
    reply: () => ({
      kind: 'text',
      body: `That sounds like something **Arbor AI** is built for \u2014 it answers questions across your school data (attendance, attainment, pastoral risk).

Switch to the Arbor tab at the top to upload a CSV and ask directly there.`,
    }),
  },
]

export function mockReply(input: string, profile: TeacherProfile | null): MockReply {
  const trimmed = input.trim()

  // Slash command match (prefix)
  for (const [cmd, fn] of Object.entries(SLASH_REPLIES)) {
    if (trimmed.startsWith(cmd)) {
      const tail = trimmed.slice(cmd.length)
      return fn(profile, tail)
    }
  }

  // Keyword routing
  for (const { trigger, reply } of KEYWORD_REPLIES) {
    if (trigger.test(trimmed)) return reply(profile)
  }

  // Generic clarify
  for (const { trigger, reply } of CLARIFIES) {
    if (trigger.test(trimmed)) return reply()
  }

  // Default: short helpful response
  return {
    kind: 'text',
    body: `I can help you with lesson plans, worksheets, quizzes, exit tickets, parent emails \u2014 or pedagogical tweaks via slash commands (${['/bloom', '/retrieval', '/differentiate', '/exit-ticket', '/hinge', '/success-criteria'].join(', ')}).

Try a line like “fractions lesson plan for year 4, mixed ability” or “/retrieval on place value”.`,
  }
}

// ── Streaming helper ──────────────────────────────────────────

export function streamText(
  full:     string,
  onChar:   (soFar: string) => void,
  onDone:   () => void,
  speedMs = 12,
): () => void {
  let i = 0
  const len = full.length
  const id = setInterval(() => {
    // Burst multiple chars per tick for speed
    i = Math.min(len, i + 3)
    onChar(full.slice(0, i))
    if (i >= len) {
      clearInterval(id)
      onDone()
    }
  }, speedMs)

  return () => clearInterval(id)
}
