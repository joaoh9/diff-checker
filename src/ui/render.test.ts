/** @vitest-environment jsdom */

import { describe, expect, it } from 'vitest'
import { compareTexts } from '../diff/compare.ts'
import { renderDiff } from './render.ts'

describe('renderDiff', () => {
  it('renders user text as text, not HTML', () => {
    const board = document.createElement('div')
    const result = compareTexts('<img src=x onerror=alert(1)>', '<script>alert(1)</script>')
    renderDiff(board, result)

    expect(board.querySelectorAll('img, script')).toHaveLength(0)
    expect(board.textContent).toContain('<img src=x onerror=alert(1)>')
    expect(board.textContent).toContain('<script>alert(1)</script>')
  })

  it('does not mark the untouched side of a one-sided edit', () => {
    const board = document.createElement('div')
    renderDiff(board, compareTexts('Please bring the Q2 report.', 'Please bring the Q2 report and notes.'))

    const left = board.querySelector('.cell-left')
    const right = board.querySelector('.cell-right')
    expect(left?.classList.contains('has-mark')).toBe(false)
    expect(right?.classList.contains('has-mark')).toBe(true)
  })

  it('keeps add and remove on the same aligned row', () => {
    const board = document.createElement('div')
    renderDiff(board, compareTexts('left only', 'right only'))

    const rows = board.querySelectorAll('.diff-row')
    expect(rows).toHaveLength(1)
    expect(rows[0].querySelector('.cell-left')?.textContent).toContain('left only')
    expect(rows[0].querySelector('.cell-right')?.textContent).toContain('right only')
  })
})
