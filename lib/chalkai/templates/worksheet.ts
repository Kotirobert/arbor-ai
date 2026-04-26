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
