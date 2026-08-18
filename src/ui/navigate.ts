import type { RowKind } from '../diff/types.ts'

export function isDiffRowKind(kind: RowKind): boolean {
  return kind !== 'equal'
}

export function nextDiffIndex(current: number, count: number): number {
  if (count <= 0) return -1
  return (current + 1) % count
}

export function formatDiffPosition(current: number, count: number): string {
  if (count <= 0) return 'No changes'
  if (current < 0) return `${count} ${count === 1 ? 'change' : 'changes'}`
  return `${current + 1} of ${count}`
}
