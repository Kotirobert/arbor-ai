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
