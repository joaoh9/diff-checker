import { describe, expect, it } from 'vitest'
import { compareTexts, countWordsIn, formatSummary, normalizeNewlines, splitChunkLines } from './compare.ts'
import { EXAMPLE_CHANGED, EXAMPLE_ORIGINAL } from './example.ts'

function rowKinds(original: string, changed: string) {
  return compareTexts(original, changed).rows.map((row) => row.kind)
}

function joined(tokens: { value: string }[] | null) {
  return tokens?.map((token) => token.value).join('') ?? ''
}

describe('normalizeNewlines', () => {
  it('treats CRLF, CR, and LF as the same line break', () => {
    expect(normalizeNewlines('a\r\nb\rc\n')).toBe('a\nb\nc\n')
  })
})

describe('splitChunkLines', () => {
  it('keeps a trailing blank line only when the chunk ends with a newline after content', () => {
    expect(splitChunkLines('a\nb\n')).toEqual(['a', 'b'])
    expect(splitChunkLines('a\nb')).toEqual(['a', 'b'])
    expect(splitChunkLines('\n')).toEqual([''])
    expect(splitChunkLines('')).toEqual([])
  })
})

describe('compareTexts', () => {
  it('marks both-empty input as empty and identical', () => {
    const result = compareTexts('', '')
    expect(result.empty).toBe(true)
    expect(result.identical).toBe(true)
    expect(result.rows).toEqual([])
  })

  it('treats CRLF vs LF identical texts as the same', () => {
    const result = compareTexts('hello\r\nworld\r\n', 'hello\nworld\n')
    expect(result.identical).toBe(true)
    expect(result.stats.changedLines).toBe(0)
  })

  it('ignores a missing final newline when the rest matches', () => {
    const result = compareTexts('hello\nworld\n', 'hello\nworld')
    expect(result.identical).toBe(true)
  })

  it('returns one equal row per line when texts match', () => {
    const result = compareTexts('one\ntwo', 'one\ntwo')
    expect(result.identical).toBe(true)
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toMatchObject({ kind: 'equal', leftNumber: 1, rightNumber: 1 })
    expect(result.rows[1]).toMatchObject({ kind: 'equal', leftNumber: 2, rightNumber: 2 })
  })

  it('highlights a single word change inside a shared line', () => {
    const result = compareTexts('The cat sat.', 'The dog sat.')
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].kind).toBe('change')
    expect(result.rows[0].left).toEqual([
      { value: 'The ', kind: 'equal' },
      { value: 'cat', kind: 'remove' },
      { value: ' sat.', kind: 'equal' },
    ])
    expect(result.rows[0].right).toEqual([
      { value: 'The ', kind: 'equal' },
      { value: 'dog', kind: 'add' },
      { value: ' sat.', kind: 'equal' },
    ])
    expect(result.stats).toMatchObject({
      changedLines: 1,
      addedLines: 0,
      removedLines: 0,
      addedWords: 1,
      removedWords: 1,
    })
  })

  it('marks a line inserted in the middle as an add', () => {
    const result = compareTexts('alpha\ngamma', 'alpha\nbeta\ngamma')
    expect(rowKinds('alpha\ngamma', 'alpha\nbeta\ngamma')).toEqual(['equal', 'add', 'equal'])
    expect(result.rows[1]).toMatchObject({
      kind: 'add',
      leftNumber: null,
      rightNumber: 2,
    })
    expect(joined(result.rows[1].right)).toBe('beta')
  })

  it('marks a deleted line as a remove', () => {
    const result = compareTexts('alpha\nbeta\ngamma', 'alpha\ngamma')
    expect(result.rows.map((row) => row.kind)).toEqual(['equal', 'remove', 'equal'])
    expect(result.rows[1]).toMatchObject({
      kind: 'remove',
      leftNumber: 2,
      rightNumber: null,
    })
  })

  it('pairs leftover lines after a shorter replacement as pure add/remove', () => {
    const result = compareTexts('keep\nold-a\nold-b\nold-c', 'keep\nnew-only')
    expect(result.rows.map((row) => row.kind)).toEqual(['equal', 'change', 'remove', 'remove'])
    expect(joined(result.rows[1].left)).toBe('old-a')
    expect(joined(result.rows[1].right)).toBe('new-only')
    expect(result.stats.removedLines).toBe(2)
    expect(result.stats.changedLines).toBe(1)
  })

  it('treats a wholly new document as adds and a cleared document as removes', () => {
    const added = compareTexts('', 'only right')
    expect(added.rows).toHaveLength(1)
    expect(added.rows[0].kind).toBe('add')
    expect(added.stats.addedWords).toBe(2)

    const removed = compareTexts('only left', '')
    expect(removed.rows[0].kind).toBe('remove')
    expect(removed.stats.removedWords).toBe(2)
  })

  it('turns the built-in example into word-level edits', () => {
    const result = compareTexts(EXAMPLE_ORIGINAL, EXAMPLE_CHANGED)
    expect(result.identical).toBe(false)
    expect(result.stats.changedLines).toBe(3)
    expect(result.stats.addedWords).toBeGreaterThan(0)
    expect(result.stats.removedWords).toBeGreaterThan(0)
  })

  it('preserves angle brackets as plain text tokens', () => {
    const result = compareTexts('<div>old</div>', '<div>new</div>')
    expect(joined(result.rows[0].left)).toBe('<div>old</div>')
    expect(joined(result.rows[0].right)).toBe('<div>new</div>')
  })
})

describe('formatSummary', () => {
  it('explains empty and identical states', () => {
    expect(formatSummary(compareTexts('', ''))).toBe('Paste the two texts you want to compare.')
    expect(formatSummary(compareTexts('same', 'same'))).toBe('These texts are the same.')
  })

  it('names mixed line edits and word counts', () => {
    const result = compareTexts(
      'alpha\nold word\ndrop me\nbeta',
      'alpha\nnew word\nbeta\nadded me',
    )
    expect(result.rows.map((row) => row.kind)).toEqual([
      'equal',
      'change',
      'remove',
      'equal',
      'add',
    ])
    expect(formatSummary(result)).toBe('1 line changed, 1 added, 1 removed. +3 / −3 words')
  })
})

describe('countWordsIn', () => {
  it('ignores empty and whitespace-only strings', () => {
    expect(countWordsIn('')).toBe(0)
    expect(countWordsIn('   \n\t')).toBe(0)
    expect(countWordsIn(' two  words ')).toBe(2)
  })
})
