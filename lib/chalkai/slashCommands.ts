export interface SlashCommand {
  cmd:         string
  label:       string
  description: string
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    cmd: '/bloom',
    label: 'Apply Bloom\u2019s taxonomy',
    description: 'Rewrites last resource with six Bloom levels',
  },
  {
    cmd: '/retrieval',
    label: 'Retrieval practice',
    description: 'Add 3-5 spaced-repetition recall questions',
  },
  {
    cmd: '/differentiate',
    label: 'Differentiate',
    description: 'Support / expected / challenge versions',
  },
  {
    cmd: '/exit-ticket',
    label: 'Exit ticket',
    description: '3-question formative check',
  },
  {
    cmd: '/hinge',
    label: 'Hinge question',
    description: 'Mid-lesson misconception probe',
  },
  {
    cmd: '/success-criteria',
    label: 'Success criteria',
    description: 'Three pupil-facing success criteria',
  },
]
