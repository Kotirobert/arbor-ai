/**
 * lib/schoolContext.ts
 *
 * Builds a comprehensive structured context string from uploaded school data.
 * Sent to OpenAI with every chat query so it can answer specific questions
 * about any pupil, year group, subject, gender, or attendance pattern.
 */

import type { ParsedSchoolData } from '@/lib/csvParser'

export function buildSchoolContext(data: ParsedSchoolData): string {
  const { pupils, attendance, subjectProfiles, riskProfiles, stats } = data

  if (!pupils.length) return 'No school data uploaded.'

  const lines: string[] = []
  const yearGroups = [...new Set(pupils.map(p => p.yearGroup))].sort()

  // ── School overview ─────────────────────────────────────────
  const boys  = pupils.filter(p => p.sex === 'Male').length
  const girls = pupils.filter(p => p.sex === 'Female').length

  lines.push(`=== SCHOOL OVERVIEW ===`)
  lines.push(`Total pupils: ${pupils.length} (${boys} boys, ${girls} girls)`)
  lines.push(`Average attendance: ${stats.overallAttendancePct}%`)
  lines.push(`Persistent absence (<90%): ${stats.attendanceConcerns} pupils`)
  lines.push(`High pastoral priority: ${stats.pupilsNeedingAttention} pupils`)
  lines.push(`Pupils with 5+ subjects below expected: ${stats.behaviourConcerns}`)
  lines.push(`Year groups: ${yearGroups.join(', ')}`)
  lines.push('')

  // ── Per year group breakdown ────────────────────────────────
  lines.push(`=== YEAR GROUP BREAKDOWN ===`)
  for (const yg of yearGroups) {
    const yPupils = pupils.filter(p => p.yearGroup === yg)
    const yBoys   = yPupils.filter(p => p.sex === 'Male').length
    const yGirls  = yPupils.filter(p => p.sex === 'Female').length
    const yIds    = new Set(yPupils.map(p => p.id))
    const yAtt    = attendance.filter(a => yIds.has(a.pupilId))
    const avg     = yAtt.length
      ? Math.round(yAtt.reduce((s, a) => s + a.overallPct, 0) / yAtt.length * 10) / 10
      : 0
    const pa      = yAtt.filter(a => a.overallPct < 90).length
    const yRisk   = riskProfiles.filter(r => yIds.has(r.pupilId))
    const highRisk = yRisk.filter(r => r.riskLevel === 'high').length

    lines.push(`${yg}: ${yPupils.length} pupils (${yBoys} boys, ${yGirls} girls) | Attendance: ${avg}% | PA: ${pa} | High priority: ${highRisk}`)
  }
  lines.push('')

  // ── Subject attainment school-wide ──────────────────────────
  if (subjectProfiles.length > 0) {
    const allSubjects = [...new Set(subjectProfiles.flatMap(s => Object.keys(s.subjects)))]
    lines.push(`=== SUBJECT ATTAINMENT (all ${pupils.length} pupils) ===`)
    lines.push(`Format: Subject | below expected | at expected | greater depth`)

    for (const subj of allSubjects) {
      let pre = 0, wt = 0, exp = 0, gd = 0
      for (const prof of subjectProfiles) {
        const band = prof.subjects[subj]
        if (band === 'Pre-Working Towards') pre++
        else if (band === 'Working Towards') wt++
        else if (band === 'Expected') exp++
        else if (band === 'Greater Depth') gd++
      }
      const total   = pre + wt + exp + gd
      const belowN  = pre + wt
      const pBelow  = total ? Math.round(belowN / total * 100) : 0
      const pExp    = total ? Math.round(exp / total * 100) : 0
      const pGD     = total ? Math.round(gd / total * 100) : 0
      lines.push(`${subj}: ${belowN} below (${pBelow}%) | ${exp} expected (${pExp}%) | ${gd} GD (${pGD}%)`)
    }
    lines.push('')

    // ── Core subjects by year group ──────────────────────────
    const coreSubjects = ['Reading', 'Writing', 'Maths'].filter(s =>
      subjectProfiles.some(p => p.subjects[s])
    )
    if (coreSubjects.length > 0) {
      lines.push(`=== CORE SUBJECTS BY YEAR GROUP (% at or above expected) ===`)
      for (const yg of yearGroups) {
        const yIds  = new Set(pupils.filter(p => p.yearGroup === yg).map(p => p.id))
        const yProf = subjectProfiles.filter(s => yIds.has(s.pupilId))
        if (!yProf.length) continue
        const parts = coreSubjects.map(subj => {
          const atExp = yProf.filter(p =>
            p.subjects[subj] === 'Expected' || p.subjects[subj] === 'Greater Depth'
          ).length
          return `${subj}: ${Math.round(atExp / yProf.length * 100)}%`
        })
        lines.push(`${yg}: ${parts.join(' | ')}`)
      }
      lines.push('')
    }
  }

  // ── Full pupil list ─────────────────────────────────────────
  // Include every pupil so the AI can answer specific questions
  lines.push(`=== ALL PUPILS ===`)
  lines.push(`Format: Name | Year | Sex | Attendance | Risk | Subjects below expected`)

  for (const pupil of pupils) {
    const att  = attendance.find(a => a.pupilId === pupil.id)
    const risk = riskProfiles.find(r => r.pupilId === pupil.id)
    const subj = subjectProfiles.find(s => s.pupilId === pupil.id)

    const attStr   = att  ? `${att.overallPct}%` : 'N/A'
    const riskStr  = risk ? risk.riskLevel : 'unknown'
    const belowStr = subj?.belowExpected.length
      ? subj.belowExpected.join(', ')
      : 'none'

    lines.push(
      `${pupil.fullName} | ${pupil.yearGroup} | ${pupil.sex} | ${attStr} | ${riskStr} | Below: ${belowStr}`
    )
  }
  lines.push('')

  return lines.join('\n')
}
