import { diffLines, diffWordsWithSpace } from 'diff'
import type { Change } from 'diff'
import type { DiffResult, DiffRow, DiffStats, InlineToken } from './types.ts'

const emptyStats = (): DiffStats => ({
  addedLines: 0,
  removedLines: 0,
  changedLines: 0,
  addedWords: 0,
  removedWords: 0,
})

export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

export function splitChunkLines(value: string): string[] {
  if (value === '') return []
  const parts = value.split('\n')
  if (value.endsWith('\n')) parts.pop()
  return parts
}

export function countWordsIn(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

function countTokenWords(tokens: InlineToken[] | null, kind: 'add' | 'remove'): number {
  if (!tokens) return 0
  return tokens.reduce((sum, token) => {
    if (token.kind !== kind) return sum
    return sum + countWordsIn(token.value)
  }, 0)
}

function wordTokens(leftLine: string, rightLine: string): {
  left: InlineToken[]
  right: InlineToken[]
} {
  if (leftLine === rightLine) {
    return {
      left: [{ value: leftLine, kind: 'equal' }],
      right: [{ value: rightLine, kind: 'equal' }],
    }
  }

  const parts = diffWordsWithSpace(leftLine, rightLine)
  const left: InlineToken[] = []
  const right: InlineToken[] = []

  for (const part of parts) {
    if (part.added) {
      right.push({ value: part.value, kind: 'add' })
    } else if (part.removed) {
      left.push({ value: part.value, kind: 'remove' })
    } else {
      left.push({ value: part.value, kind: 'equal' })
      right.push({ value: part.value, kind: 'equal' })
    }
  }

  return { left, right }
}

function pushEqual(rows: DiffRow[], line: string, leftNumber: number, rightNumber: number) {
  rows.push({
    kind: 'equal',
    leftNumber,
    rightNumber,
    left: [{ value: line, kind: 'equal' }],
    right: [{ value: line, kind: 'equal' }],
  })
}

function pushRemove(rows: DiffRow[], line: string, leftNumber: number) {
  rows.push({
    kind: 'remove',
    leftNumber,
    rightNumber: null,
    left: [{ value: line, kind: 'remove' }],
    right: null,
  })
}

function pushAdd(rows: DiffRow[], line: string, rightNumber: number) {
  rows.push({
    kind: 'add',
    leftNumber: null,
    rightNumber,
    left: null,
    right: [{ value: line, kind: 'add' }],
  })
}

function collectStats(rows: DiffRow[]): DiffStats {
  const stats = emptyStats()
  for (const row of rows) {
    if (row.kind === 'add') stats.addedLines += 1
    if (row.kind === 'remove') stats.removedLines += 1
    if (row.kind === 'change') stats.changedLines += 1
    stats.addedWords += countTokenWords(row.right, 'add')
    stats.removedWords += countTokenWords(row.left, 'remove')
  }
  return stats
}

export function compareTexts(original: string, changed: string): DiffResult {
  const leftText = normalizeNewlines(original)
  const rightText = normalizeNewlines(changed)
  const empty = leftText === '' && rightText === ''

  if (empty) {
    return { rows: [], stats: emptyStats(), identical: true, empty: true }
  }

  if (leftText === rightText) {
    const rows: DiffRow[] = []
    const chunk = leftText.endsWith('\n') ? leftText : `${leftText}\n`
    splitChunkLines(chunk).forEach((line, index) => {
      pushEqual(rows, line, index + 1, index + 1)
    })
    return { rows, stats: emptyStats(), identical: true, empty: false }
  }

  const parts: Change[] = diffLines(leftText, rightText, {
    ignoreNewlineAtEof: true,
    stripTrailingCr: true,
  })

  const rows: DiffRow[] = []
  let leftNumber = 1
  let rightNumber = 1
  let index = 0

  while (index < parts.length) {
    const part = parts[index]
    const next = parts[index + 1]

    if (!part.added && !part.removed) {
      for (const line of splitChunkLines(part.value)) {
        pushEqual(rows, line, leftNumber, rightNumber)
        leftNumber += 1
        rightNumber += 1
      }
      index += 1
      continue
    }

    if (part.removed && next?.added) {
      const removed = splitChunkLines(part.value)
      const added = splitChunkLines(next.value)
      const paired = Math.min(removed.length, added.length)

      for (let pairIndex = 0; pairIndex < paired; pairIndex += 1) {
        const tokens = wordTokens(removed[pairIndex], added[pairIndex])
        const changedLine =
          tokens.left.some((token) => token.kind !== 'equal') ||
          tokens.right.some((token) => token.kind !== 'equal')

        rows.push({
          kind: changedLine ? 'change' : 'equal',
          leftNumber,
          rightNumber,
          left: tokens.left,
          right: tokens.right,
        })
        leftNumber += 1
        rightNumber += 1
      }

      for (let removeIndex = paired; removeIndex < removed.length; removeIndex += 1) {
        pushRemove(rows, removed[removeIndex], leftNumber)
        leftNumber += 1
      }

      for (let addIndex = paired; addIndex < added.length; addIndex += 1) {
        pushAdd(rows, added[addIndex], rightNumber)
        rightNumber += 1
      }

      index += 2
      continue
    }

    if (part.removed) {
      for (const line of splitChunkLines(part.value)) {
        pushRemove(rows, line, leftNumber)
        leftNumber += 1
      }
      index += 1
      continue
    }

    for (const line of splitChunkLines(part.value)) {
      pushAdd(rows, line, rightNumber)
      rightNumber += 1
    }
    index += 1
  }

  const stats = collectStats(rows)
  const identical =
    stats.addedLines === 0 && stats.removedLines === 0 && stats.changedLines === 0

  return { rows, stats, identical, empty: false }
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

export function formatSummary(result: DiffResult): string {
  if (result.empty) return 'Paste the two texts you want to compare.'
  if (result.identical) return 'These texts are the same.'

  const { changedLines, addedLines, removedLines, addedWords, removedWords } = result.stats
  const lineBits: string[] = []

  if (changedLines) lineBits.push(plural(changedLines, 'line') + ' changed')
  if (addedLines) {
    lineBits.push(changedLines ? `${addedLines} added` : plural(addedLines, 'line') + ' added')
  }
  if (removedLines) {
    lineBits.push(
      changedLines || addedLines ? `${removedLines} removed` : plural(removedLines, 'line') + ' removed',
    )
  }

  const lines = lineBits.join(', ')
  const words = `+${addedWords} / −${removedWords} words`
  return lines ? `${lines}. ${words}` : words
}
