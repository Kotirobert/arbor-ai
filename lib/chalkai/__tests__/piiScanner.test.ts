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
