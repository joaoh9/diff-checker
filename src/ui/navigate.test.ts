import { describe, expect, it } from 'vitest'
import { formatDiffPosition, isDiffRowKind, nextDiffIndex } from './navigate.ts'

describe('isDiffRowKind', () => {
  it('treats equal rows as uninteresting and every other kind as a stop', () => {
    expect(isDiffRowKind('equal')).toBe(false)
    expect(isDiffRowKind('add')).toBe(true)
    expect(isDiffRowKind('remove')).toBe(true)
    expect(isDiffRowKind('change')).toBe(true)
  })
})

describe('nextDiffIndex', () => {
  it('returns -1 when there are no changes', () => {
    expect(nextDiffIndex(-1, 0)).toBe(-1)
    expect(nextDiffIndex(2, 0)).toBe(-1)
  })

  it('starts at the first change from an unset cursor', () => {
    expect(nextDiffIndex(-1, 4)).toBe(0)
  })

  it('advances one stop and wraps after the last', () => {
    expect(nextDiffIndex(0, 3)).toBe(1)
    expect(nextDiffIndex(1, 3)).toBe(2)
    expect(nextDiffIndex(2, 3)).toBe(0)
  })
})

describe('formatDiffPosition', () => {
  it('names the empty and unset states, then the current stop', () => {
    expect(formatDiffPosition(-1, 0)).toBe('No changes')
    expect(formatDiffPosition(-1, 1)).toBe('1 change')
    expect(formatDiffPosition(-1, 4)).toBe('4 changes')
    expect(formatDiffPosition(0, 4)).toBe('1 of 4')
    expect(formatDiffPosition(3, 4)).toBe('4 of 4')
  })
})
