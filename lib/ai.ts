/**
 * lib/ai.ts  — server-side only
 *
 * Uses OpenAI when OPENAI_API_KEY is set in .env.local.
 * Falls back to data-aware template responses when no key is present.
 *
 * IMPORTANT: Never import this file from client components.
 * All AI calls go through /api/insights and /api/pupils/[id]/summary.
 */

import type {
  Pupil, AttendanceSummary, BehaviourSummary,
  RiskProfile, AiSummary, AiChatResponse,
} from '@/types'

// ── Config (re-read per request, not cached at module load) ───

function getApiKey() { return process.env.OPENAI_API_KEY ?? '' }
function getModel()  { return process.env.OPENAI_MODEL   ?? 'gpt-4o-mini' }
function isAiOn()    { return getApiKey().length > 10 }

// ── OpenAI caller ─────────────────────────────────────────────

async function callOpenAI(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model:       getModel(),
      max_tokens:  800,
      temperature: 0.3,
      messages:    [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(`OpenAI ${res.status}: ${err.error?.message ?? 'Unknown error'}`)
  }

  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices[0]?.message?.content?.trim() ?? ''
}

// ── System prompts ────────────────────────────────────────────

const CHAT_SYSTEM = `You are a pastoral data assistant for a UK primary school.
You have been given detailed school data. Answer questions directly using specific names, numbers, and year groups from the data.
Write in plain British English. Be concise and specific.
If asked for a count (e.g. "how many boys in Year 1"), count exactly from the data and give the number.
If asked for a list of pupils, give their actual names from the data.
Never say you don't have access to the data — it is all in the context provided.`

const PUPIL_SYSTEM = `You are a pastoral care assistant for a UK primary school.
Write a concise pastoral summary using the specific data provided. British English only.
Return ONLY valid JSON with keys "narrative" (string) and "recommendations" (array of strings).`

// ── Chat ──────────────────────────────────────────────────────

export async function generateChatResponse(
  query: string,
  role: string,
  schoolContext?: string,
  conversationHistory?: string,
): Promise<AiChatResponse> {
  if (isAiOn()) {
    return chatWithAI(query, role, schoolContext, conversationHistory)
  }
  return chatWithTemplate(query, schoolContext)
}

async function chatWithAI(
  query: string,
  role: string,
  schoolContext?: string,
  conversationHistory?: string,
): Promise<AiChatResponse> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []

  // Reconstruct prior turns for follow-up support
  if (conversationHistory) {
    for (const turn of conversationHistory.split('\n\n')) {
      const u = turn.match(/^User: (.+)/s)
      const a = turn.match(/\nAssistant: (.+)/s)
      if (u) messages.push({ role: 'user',      content: u[1].trim() })
      if (a) messages.push({ role: 'assistant', content: a[1].trim() })
    }
  }

  // Final user message — inject the full school data context
  const contextBlock = schoolContext
    ? `\n\nSCHOOL DATA:\n${schoolContext}\n\n`
    : '\n\nNo school data has been uploaded yet — ask the user to upload a CSV.\n\n'

  messages.push({
    role: 'user',
    content: `${contextBlock}QUESTION (from ${role}): ${query}`,
  })

  try {
    const response = await callOpenAI(CHAT_SYSTEM, messages)
    return { query, response, relatedPupilIds: [], generatedAt: new Date().toISOString() }
  } catch (err) {
    console.error('[ai] chat error:', err)
    return chatWithTemplate(query, schoolContext)
  }
}

// ── Template fallback (no API key) ───────────────────────────
// Parses the structured context to answer common questions with real data.

function chatWithTemplate(query: string, schoolContext?: string): AiChatResponse {
  const q   = query.toLowerCase()
  const ctx = schoolContext ?? ''

  // ── Parse context into usable data ──────────────────────────

  // Overall stats
  const totalMatch  = ctx.match(/Total pupils: (\d+) \((\d+) boys, (\d+) girls\)/)
  const total       = Number(totalMatch?.[1] ?? 0)
  const totalBoys   = Number(totalMatch?.[2] ?? 0)
  const totalGirls  = Number(totalMatch?.[3] ?? 0)
  const avgAttMatch = ctx.match(/Average attendance: ([\d.]+)%/)
  const avgAtt      = avgAttMatch?.[1] ?? 'N/A'
  const paMatch     = ctx.match(/Persistent absence.*?: (\d+) pupils/)
  const paCount     = Number(paMatch?.[1] ?? 0)

  // Year group lines: "Year 1: 30 pupils (14 boys, 16 girls) | Attendance: 93.2% | PA: 6 | High priority: 3"
  const ygLines = ctx.split('\n').filter(l =>
    l.match(/^(Reception|Year \d):/) && l.includes('pupils')
  )
  const parseYg = (line: string) => {
    const name   = line.match(/^([^:]+):/)?.[1] ?? ''
    const count  = Number(line.match(/(\d+) pupils/)?.[1] ?? 0)
    const boys   = Number(line.match(/(\d+) boys/)?.[1] ?? 0)
    const girls  = Number(line.match(/(\d+) girls/)?.[1] ?? 0)
    const att    = line.match(/Attendance: ([\d.]+)%/)?.[1] ?? 'N/A'
    const pa     = Number(line.match(/PA: (\d+)/)?.[1] ?? 0)
    const hi     = Number(line.match(/High priority: (\d+)/)?.[1] ?? 0)
    return { name, count, boys, girls, att, pa, hi }
  }
  const ygs = ygLines.map(parseYg)

  // Full pupil list: "Name | Year | Sex | Attendance | Risk | Below: ..."
  const pupilLines = ctx.split('\n').filter(l =>
    l.includes(' | ') && (l.includes('Male') || l.includes('Female'))
  )
  const parsePupil = (line: string) => {
    const [name, yg, sex, att, risk, belowRaw] = line.split(' | ').map(s => s.trim())
    const below = belowRaw?.replace('Below: ', '') ?? 'none'
    return { name, yg, sex, att, risk, below }
  }
  const allPupils = pupilLines.map(parsePupil)

  // ── Route the query ──────────────────────────────────────────

  // Gender + year group count: "how many boys in year 1"
  const genderYearMatch = q.match(/(boys?|girls?|male|female).*?(reception|year \d+)|(reception|year \d+).*(boys?|girls?|male|female)/)
  if (genderYearMatch || (q.includes('boy') && q.includes('year')) || (q.includes('girl') && q.includes('year'))) {
    const isBoy = q.includes('boy') || q.includes('male')
    const ygName = q.match(/(reception|year \d+)/i)?.[0]
    if (ygName) {
      const yg = ygs.find(y => y.name.toLowerCase() === ygName.toLowerCase())
      if (yg) {
        const n = isBoy ? yg.boys : yg.girls
        return reply(query, `There are ${n} ${isBoy ? 'boys' : 'girls'} in ${yg.name} (${yg.count} pupils total).`)
      }
    }
  }

  // Gender school-wide
  if ((q.includes('how many') || q.includes('total')) && (q.includes('boy') || q.includes('girl'))) {
    const isBoy = q.includes('boy')
    return reply(query, `There are ${isBoy ? totalBoys : totalGirls} ${isBoy ? 'boys' : 'girls'} enrolled school-wide (${total} total pupils).`)
  }

  // Year group specific query
  const ygInQuery = q.match(/(reception|year \d+)/i)?.[0]?.toLowerCase()
  if (ygInQuery && !q.includes('group')) {
    const yg = ygs.find(y => y.name.toLowerCase() === ygInQuery)
    if (yg) {
      return reply(query,
        `${yg.name}: ${yg.count} pupils (${yg.boys} boys, ${yg.girls} girls)\n` +
        `Attendance: ${yg.att}% | Persistent absence: ${yg.pa} pupils | High priority: ${yg.hi} pupils`
      )
    }
  }

  // Specific pupil by name
  const namedPupil = allPupils.find(p =>
    p.name && q.includes(p.name.toLowerCase().split(' ')[0].toLowerCase())
  )
  if (namedPupil) {
    const attNum = Number(namedPupil.att?.replace('%', '') ?? 0)
    return reply(query,
      `${namedPupil.name} (${namedPupil.yg}, ${namedPupil.sex}):\n` +
      `• Attendance: ${namedPupil.att}${attNum < 90 ? ' — persistent absence' : ''}\n` +
      `• Risk: ${namedPupil.risk}\n` +
      `• Subjects below expected: ${namedPupil.below}`
    )
  }

  // Persistent absence
  if (q.includes('persistent') || (q.includes('pa') && q.includes('pupil')) || q.includes('absent')) {
    const paPupils = allPupils.filter(p => {
      const attNum = Number(p.att?.replace('%', '') ?? 100)
      return attNum < 90
    }).sort((a, b) => Number(a.att.replace('%', '')) - Number(b.att.replace('%', '')))

    const list = paPupils.slice(0, 10).map(p => `• ${p.name} (${p.yg}): ${p.att}`).join('\n')
    return reply(query,
      `${paCount} pupils are in persistent absence (below 90%):\n${list}` +
      (paPupils.length > 10 ? `\n...and ${paPupils.length - 10} more` : '')
    )
  }

  // Subject query with year
  const subjects = ['Reading', 'Writing', 'Maths', 'Science', 'History', 'Geography', 'Computing', 'Art', 'Music', 'PE', 'RE']
  const matchedSubject = subjects.find(s => q.includes(s.toLowerCase()))
  if (matchedSubject && ygInQuery) {
    const ygPupils = allPupils.filter(p => p.yg?.toLowerCase() === ygInQuery)
    const below    = ygPupils.filter(p => p.below?.includes(matchedSubject))
    return reply(query,
      `${matchedSubject} in ${ygInQuery.replace(/\b\w/g, l => l.toUpperCase())}:\n` +
      `• Below expected: ${below.length} of ${ygPupils.length} pupils\n` +
      (below.length > 0 ? `• Pupils: ${below.map(p => p.name).join(', ')}` : '')
    )
  }

  // Attendance overview
  if (q.includes('attendance')) {
    const byYg = ygs.map(y => `• ${y.name}: ${y.att}% (${y.pa} PA)`).join('\n')
    return reply(query, `School attendance: ${avgAtt}% average\n\nBy year group:\n${byYg}`)
  }

  // Summary / overview
  if (q.includes('summar') || q.includes('overview') || q.includes('whole school')) {
    return reply(query,
      `School overview:\n` +
      `• ${total} pupils (${totalBoys} boys, ${totalGirls} girls)\n` +
      `• ${avgAtt}% average attendance\n` +
      `• ${paCount} pupils in persistent absence\n` +
      `• Year groups: ${ygs.map(y => `${y.name} (${y.count})`).join(', ')}`
    )
  }

  // Fallback — at least extract something useful from context
  return reply(query,
    total > 0
      ? `I have data for ${total} pupils (${totalBoys} boys, ${totalGirls} girls) with ${avgAtt}% average attendance. ` +
        `To answer "${query}" more specifically, please add your OpenAI API key to .env.local.`
      : `No school data has been uploaded yet. Please go to /upload and upload your CSV file first.`
  )
}

function reply(query: string, response: string): AiChatResponse {
  return { query, response, relatedPupilIds: [], generatedAt: new Date().toISOString() }
}

// ── Pupil summary ─────────────────────────────────────────────

export async function generatePupilSummary(
  pupil: Pupil,
  attendance: AttendanceSummary,
  behaviour: BehaviourSummary,
  risk: RiskProfile,
  subjectProfile?: { subjects: Record<string, string>; belowExpected: string[] } | null,
): Promise<AiSummary> {
  const below = subjectProfile?.belowExpected ?? []

  if (isAiOn()) {
    return pupilSummaryAI(pupil, attendance, behaviour, risk, below, subjectProfile?.subjects)
  }
  return pupilSummaryTemplate(pupil, attendance, risk, below)
}

async function pupilSummaryAI(
  pupil: Pupil,
  attendance: AttendanceSummary,
  _behaviour: BehaviourSummary,
  risk: RiskProfile,
  belowExpected: string[],
  allSubjects?: Record<string, string>,
): Promise<AiSummary> {
  const trend = attendance.weeklyTrend.map(w => `${w.weekLabel}: ${w.pct}%`).join(', ')

  const subjText = allSubjects
    ? Object.entries(allSubjects).map(([s, b]) => `${s}: ${b}`).join(', ')
    : belowExpected.length > 0
    ? `Below expected in: ${belowExpected.join(', ')}`
    : 'All subjects at expected or above'

  const userPrompt =
    `Write a pastoral summary for:\n` +
    `Name: ${pupil.fullName}, ${pupil.yearGroup}, ${pupil.sex}\n` +
    `Attendance: ${attendance.overallPct}% | Trend: ${trend}\n` +
    `Late marks: ${attendance.lateCount} | Unauthorised: ${attendance.unauthorisedAbsences}\n` +
    `Attainment: ${subjText}\n` +
    `Risk: ${risk.riskLevel} | Flags: ${risk.flags.map(f => f.description).join('; ') || 'none'}\n\n` +
    `Return ONLY this JSON: {"narrative":"2-4 sentences using specific numbers","recommendations":["step 1","step 2","step 3"]}`

  try {
    const raw  = await callOpenAI(PUPIL_SYSTEM, [{ role: 'user', content: userPrompt }])
    const json = JSON.parse(raw.replace(/```json|```/g, '').trim()) as {
      narrative: string; recommendations: string[]
    }
    return { pupilId: pupil.id, narrative: json.narrative, recommendations: json.recommendations, generatedAt: new Date().toISOString(), model: getModel() }
  } catch (err) {
    console.error('[ai] pupil summary error:', err)
    return pupilSummaryTemplate(pupil, attendance, risk, belowExpected)
  }
}

function pupilSummaryTemplate(
  pupil: Pupil,
  attendance: AttendanceSummary,
  risk: RiskProfile,
  belowExpected: string[],
): AiSummary {
  const trend = attendance.weeklyTrend
  const drop  = trend.length >= 2
    ? Math.round((trend[0].pct - trend[trend.length - 1].pct) * 10) / 10 : 0
  const parts: string[] = []

  if (attendance.overallPct < 80) {
    parts.push(`${pupil.firstName} is in persistent absence at ${attendance.overallPct}% with ${attendance.unauthorisedAbsences} unauthorised absences.`)
  } else if (attendance.overallPct < 90) {
    parts.push(`${pupil.firstName}'s attendance is ${attendance.overallPct}%${drop > 2 ? `, down ${drop}pp over 4 weeks` : ''} — persistent absence threshold.`)
  } else if (drop > 3) {
    parts.push(`Attendance has declined from ${trend[0].pct}% to ${attendance.overallPct}% over 4 weeks (−${drop}pp).`)
  } else {
    parts.push(`${pupil.firstName} is attending at ${attendance.overallPct}%, within the acceptable range.`)
  }

  if (attendance.lateCount >= 4) parts.push(`${attendance.lateCount} late marks recorded this term.`)

  if (belowExpected.length >= 5) parts.push(`${belowExpected.length} subjects below expected — comprehensive support review recommended.`)
  else if (belowExpected.length > 0) parts.push(`Attainment concern in: ${belowExpected.join(', ')}.`)

  const recs: string[] = []
  if (attendance.overallPct < 80) { recs.push('Initiate formal attendance review — EWO referral.'); recs.push('Urgent parent/carer meeting this week.') }
  else if (attendance.overallPct < 90) { recs.push('Contact parent/carer to discuss attendance.'); recs.push('Set attendance target, review in 4 weeks.') }
  if (belowExpected.length >= 5) { recs.push('Refer to SENCO for early needs assessment.'); recs.push('Arrange targeted support for core subjects.') }
  else if (belowExpected.length >= 2) recs.push(`Set up intervention sessions for ${belowExpected.slice(0, 2).join(' and ')}.`)
  if (!recs.length) { recs.push('Continue weekly monitoring.'); recs.push('Pastoral check-in at next parent consultation.') }

  return { pupilId: pupil.id, narrative: parts.join(' '), recommendations: recs, generatedAt: new Date().toISOString(), model: 'template-v2' }
}

// ── Exports ───────────────────────────────────────────────────

export const SUGGESTED_PROMPTS = [
  'How many boys are in Year 1?',
  'Which pupils are in persistent absence?',
  'How does attendance compare across year groups?',
  'List pupils below expected in Writing',
  'Summarise the whole school',
]

export const AI_ACTION_CHIPS: Record<string, string[]> = {
  slt:     ['Summarise whole school', 'List persistent absence pupils', 'Writing attainment breakdown', 'Attendance by year group', 'Top 5 priority pupils'],
  hoy:     ['Summarise my year group', 'PA pupils in my year', 'Attainment concerns this year', 'Who needs pastoral support?'],
  teacher: ['Summarise my class', 'Pupils below expected', 'Reading and writing concerns', 'Who needs the most support?'],
}
