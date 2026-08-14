export type TokenKind = 'equal' | 'add' | 'remove'

export type InlineToken = {
  value: string
  kind: TokenKind
}

export type RowKind = 'equal' | 'add' | 'remove' | 'change'

export type DiffRow = {
  kind: RowKind
  leftNumber: number | null
  rightNumber: number | null
  left: InlineToken[] | null
  right: InlineToken[] | null
}

export type DiffStats = {
  addedLines: number
  removedLines: number
  changedLines: number
  addedWords: number
  removedWords: number
}

export type DiffResult = {
  rows: DiffRow[]
  stats: DiffStats
  identical: boolean
  empty: boolean
}
