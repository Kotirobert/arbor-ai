import type { PIIFinding } from '@/types'

export interface PIIScanResult {
  findings: PIIFinding[]
  sanitised: string
  blocked: boolean
}

const BEHAVIOUR_VERBS = /\b(is|was|has|needs|struggles|told|asked|said|finds|found|works|worked|tries|tried|shows|showed|loves|hates|enjoys|refuses|refused|cried|hit|threw|shouted)\b/i

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
    sanitised = sanitised.replace(
      new RegExp(rule.regex.source, rule.regex.flags.replace('g', '') + 'g'),
      rule.replacement,
    )
  }

  // Student name heuristic: capitalised word before a behaviour verb
  const studentRegex = /\b([A-Z][a-z]{1,14})\s+(?=\S)/g
  let m: RegExpExecArray | null
  while ((m = studentRegex.exec(sanitised)) !== null) {
    const word = m[1]
    if (NOT_A_NAME.has(word)) continue
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
