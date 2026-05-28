import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { UserMemoryItem } from '@/lib/chalkai/memoryStore'
import {
  MemorySettingsPanel,
  formatMemoryValue,
  groupMemoryByKind,
} from '../MemorySettingsPanel'

const memoryItems: UserMemoryItem[] = [
  {
    id: 'mem-1',
    userId: 'user-1',
    kind: 'preference',
    key: 'output_style',
    value: { style: 'Concise', reasons: ['short lessons', 'cover notes'] },
    source: 'manual',
    confidence: 0.9,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'mem-2',
    userId: 'user-1',
    kind: 'class_context',
    key: 'year_4_math_group',
    value: { note: 'Mixed confidence with fractions' },
    source: 'profile',
    confidence: 0.8,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
    deletedAt: null,
  },
]

describe('MemorySettingsPanel', () => {
  it('groups memory by kind with user-facing labels', () => {
    const groups = groupMemoryByKind(memoryItems)

    expect(groups.map((group) => group.label)).toEqual(['Preferences', 'Class context'])
    expect(groups[0].items).toEqual([memoryItems[0]])
    expect(groups[1].items).toEqual([memoryItems[1]])
  })

  it('formats structured memory values for review', () => {
    expect(formatMemoryValue({ style: 'Concise', reasons: ['short lessons', 'cover notes'], count: 2 }))
      .toBe('Concise; short lessons, cover notes; 2')
  })

  it('renders memory controls with grouped items and delete actions', () => {
    const html = renderToStaticMarkup(
      <MemorySettingsPanel initialUserId="user-1" initialMemory={memoryItems} />,
    )

    expect(html).toContain('Memory controls')
    expect(html).toContain('Clear all memory')
    expect(html).toContain('Preferences')
    expect(html).toContain('Class context')
    expect(html).toContain('output_style')
    expect(html).toContain('Concise; short lessons, cover notes')
    expect(html).toContain('year_4_math_group')
    expect(html).toContain('Mixed confidence with fractions')
    expect(html.match(/Delete/g)).toHaveLength(2)
  })

  it('renders an empty memory state', () => {
    const html = renderToStaticMarkup(
      <MemorySettingsPanel initialUserId="user-1" initialMemory={[]} />,
    )

    expect(html).toContain('No memory has been saved yet')
  })
})
