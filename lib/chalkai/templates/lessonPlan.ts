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
