import type { ResourceType } from '@/types'

export interface ResourceTypeMeta {
  type:        ResourceType
  title:       string
  subtitle:    string
  accent:      string
  cssVar:      string
  icon:        string
}

export const RESOURCE_TYPES: ResourceTypeMeta[] = [
  {
    type: 'lesson_plan',
    title: 'Lesson Plan',
    subtitle: 'Starter \u2192 main \u2192 plenary with differentiation',
    accent: 'amber',
    cssVar: '--amber',
    icon: 'lesson',
  },
  {
    type: 'worksheet',
    title: 'Worksheet',
    subtitle: 'Warm up, main tasks, challenge, reflection',
    accent: 'green',
    cssVar: '--green',
    icon: 'worksheet',
  },
  {
    type: 'quiz',
    title: 'Quiz',
    subtitle: 'Recall \u2192 apply \u2192 extended with mark scheme',
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
]

export function metaFor(type: ResourceType): ResourceTypeMeta {
  return RESOURCE_TYPES.find((r) => r.type === type)!
}

// ── Mock generator output (fed by form inputs) ────────────────

export interface GeneratorInput {
  type:         ResourceType
  topic:        string
  yearGroup:    string
  subject?:     string
  duration?:    string
  notes?:       string
  tone?:        string
  purpose?:     string
  numQuestions?: string
}

export function mockOutputFor(input: GeneratorInput): { title: string; markdown: string } {
  const { type, topic, yearGroup, subject, duration, notes, tone, purpose, numQuestions } = input

  if (type === 'lesson_plan') {
    return {
      title: `${topic} \u2014 ${yearGroup} ${subject ?? ''}`.trim(),
      markdown: `## Learning Objective
Pupils will be able to ${topic.toLowerCase()} and explain their reasoning with examples.

## Success Criteria
- I can identify the key features of ${topic}
- I can apply what I know to a new example
- I can explain my thinking using subject vocabulary

## Starter Activity (7 mins)
Quick retrieval: on whiteboards, pupils sketch what they remember from the previous lesson.
Cold-call 3 pupils for explanations. Address any misconceptions before proceeding.

## Main Activities
**Activity 1 (15 mins) \u2014 I do / we do**
Model an example on the board with think-aloud. Pupils annotate a second example in pairs.

**Activity 2 (15 mins) \u2014 You do**
Differentiated task card (support / expected / challenge) on ${topic}. Circulate and check.

## Plenary (8 mins)
Exit ticket: three questions covering recall, application, and transfer.

## Differentiation
- **Support:** sentence starters, worked example card on desk, reduced question count
- **Expected:** standard task, access to vocabulary bank
- **Challenge:** open-ended extension requiring justification

## Assessment for Learning
Hinge question mid-lesson (all pupils show answer on fingers/cards) to check whole-class grasp before moving on.

## Resources Needed
Mini whiteboards, task cards (3 versions), exit ticket slips.

${notes ? `\n## Teacher notes\n${notes}\n` : ''}
_Duration: ${duration ?? '45 mins'} \u00b7 ${yearGroup}_`,
    }
  }

  if (type === 'worksheet') {
    return {
      title: `${topic} \u2014 ${yearGroup} Worksheet`,
      markdown: `# ${topic}
**Learning objective:** understand and apply the key ideas of ${topic}.

## Warm up
1. In one sentence, what is ${topic}?
2. Give an example you’ve seen before.
3. What is one question you already have about it?

## Main tasks
1. Identify the three key features of ${topic} from the passage.
2. Explain in your own words why the second step matters.
3. Circle the correct answer: a / b / c / d.
4. Complete the table with the missing values.
5. In 3\u20134 sentences, describe what happens when \u2026

## Challenge
Design your own example of ${topic} and explain why it works.

## Reflection
One thing I learned today:
One question I still have:

${notes ? `\n---\n**Teacher notes:** ${notes}\n` : ''}`,
    }
  }

  if (type === 'quiz') {
    const q = parseInt(numQuestions ?? '10', 10)
    const items = Array.from({ length: Math.min(Math.max(q, 4), 12) }).map((_, i) => {
      if (i < 3) return `${i + 1}. [Recall, 1 mark] State one fact about ${topic}.`
      if (i < 6) return `${i + 1}. [Understanding, 2 marks] Explain why \u2026 in the context of ${topic}.`
      if (i < 9) return `${i + 1}. [Application, 2\u20133 marks] Using ${topic}, work out \u2026`
      return `${i + 1}. [Extended, 4\u20136 marks] Evaluate the impact of ${topic} with reference to two examples.`
    }).join('\n')

    return {
      title: `${topic} Quiz \u2014 ${yearGroup}`,
      markdown: `## ${topic} Quiz
Duration: ${duration ?? '20 mins'} \u00b7 ${yearGroup} \u00b7 ${subject ?? 'Subject'}

${items}

---

## Mark scheme
**Q1\u20133:** 1 mark each for any correct key fact.
**Q4\u20136:** 1 mark for identifying the correct concept, 1 mark for a clear explanation linked to ${topic}.
**Q7\u20139:** 1 mark for method, 1 mark for correct answer, 1 mark for units / justification.
**Q10+:** Uses band descriptors 1\u20134 (see department mark scheme).

${notes ? `_Adapted for: ${notes}_` : ''}`,
    }
  }

  // parent_email
  return {
    title: `Email: ${topic}`,
    markdown: `**Subject:** ${topic} \u2014 ${yearGroup} update

Dear parent / carer,

I hope you’re well. I’m writing to share a brief update on how ${yearGroup} is getting on with ${topic} in ${subject ?? 'class'}.

${purpose ? `The purpose of this message is: **${purpose.toLowerCase()}**.\n\n` : ''}Over the past few lessons we’ve been working on ${topic}. Pupils have shown real engagement with \u2026 and the next step is to \u2026

## How you can support at home
- Ask your child to teach you one thing they learned this week
- Spend 5\u201310 minutes reviewing the key vocabulary
- Try one practice question together from their book

If you have any questions, please don’t hesitate to get in touch.

Kind regards,
Their teacher

_Tone: ${tone ?? 'Professional \u2022 Warm'}_
${notes ? `_Notes: ${notes}_` : ''}`,
  }
}
