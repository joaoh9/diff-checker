import type { DiffResult, DiffRow, InlineToken } from '../diff/types.ts'

function tokenNode(token: InlineToken): HTMLSpanElement {
  const span = document.createElement('span')
  span.className = `token token-${token.kind}`
  span.textContent = token.value === '' ? '\u00a0' : token.value
  return span
}

function gutter(kind: DiffRow['kind'], number: number | null): HTMLSpanElement {
  const el = document.createElement('span')
  el.className = 'gutter'
  if (number === null) {
    el.textContent = ''
    return el
  }

  const mark = kind === 'add' ? '+' : kind === 'remove' ? '−' : ''
  el.textContent = mark ? `${mark} ${number}` : String(number)
  return el
}

function cell(row: DiffRow, side: 'left' | 'right'): HTMLDivElement {
  const tokens = side === 'left' ? row.left : row.right
  const number = side === 'left' ? row.leftNumber : row.rightNumber
  const el = document.createElement('div')
  const vacant = tokens === null
  const hasMark = tokens?.some((token) => token.kind !== 'equal') ?? false
  el.className = `cell cell-${side}${vacant ? ' is-vacant' : ''}${hasMark ? ' has-mark' : ''}`

  el.append(gutter(row.kind, number))

  const line = document.createElement('pre')
  line.className = 'line'
  if (tokens && tokens.length > 0) {
    for (const token of tokens) line.append(tokenNode(token))
  } else {
    line.textContent = '\u00a0'
  }
  el.append(line)
  return el
}

export function renderDiff(board: HTMLElement, result: DiffResult) {
  board.replaceChildren()

  const head = document.createElement('div')
  head.className = 'diff-head'
  const originalLabel = document.createElement('div')
  originalLabel.textContent = 'Original'
  const changedLabel = document.createElement('div')
  changedLabel.textContent = 'Changed'
  head.append(originalLabel, changedLabel)
  board.append(head)

  const body = document.createElement('div')
  body.className = 'diff-body'
  body.tabIndex = 0

  if (result.rows.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'diff-empty'
    empty.textContent = 'Nothing to compare yet.'
    body.append(empty)
    board.append(body)
    return
  }

  for (const row of result.rows) {
    const rowEl = document.createElement('div')
    rowEl.className = `diff-row is-${row.kind}`
    rowEl.append(cell(row, 'left'), cell(row, 'right'))
    body.append(rowEl)
  }

  board.append(body)
}
