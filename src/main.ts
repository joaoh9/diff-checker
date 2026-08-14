import './style.css'
import { compareTexts, countWordsIn, formatSummary } from './diff/compare.ts'
import { EXAMPLE_CHANGED, EXAMPLE_ORIGINAL } from './diff/example.ts'
import { renderDiff } from './ui/render.ts'

function must<T extends Element>(selector: string): T {
  const el = document.querySelector(selector)
  if (!el) throw new Error(`Missing ${selector}`)
  return el as T
}

const originalInput = must<HTMLTextAreaElement>('#original')
const changedInput = must<HTMLTextAreaElement>('#changed')
const originalCount = must<HTMLElement>('#original-count')
const changedCount = must<HTMLElement>('#changed-count')
const compareBtn = must<HTMLButtonElement>('#compare-btn')
const exampleBtn = must<HTMLButtonElement>('#example-btn')
const clearBtn = must<HTMLButtonElement>('#clear-btn')
const editBtn = must<HTMLButtonElement>('#edit-btn')
const compose = must<HTMLElement>('#compose')
const compareView = must<HTMLElement>('#compare')
const notice = must<HTMLElement>('#notice')
const summary = must<HTMLElement>('#summary')
const board = must<HTMLElement>('#diff-board')
const shortcutKey = must<HTMLElement>('#shortcut-key')

const isApple = /Mac|iPhone|iPad/.test(navigator.platform)
shortcutKey.textContent = isApple ? 'Cmd' : 'Ctrl'

function wordsLabel(text: string): string {
  const count = countWordsIn(text)
  return `${count} ${count === 1 ? 'word' : 'words'}`
}

function refreshCounts() {
  originalCount.textContent = wordsLabel(originalInput.value)
  changedCount.textContent = wordsLabel(changedInput.value)
}

function showNotice(message: string | null) {
  if (!message) {
    notice.hidden = true
    notice.textContent = ''
    return
  }
  notice.hidden = false
  notice.textContent = message
}

function showCompose() {
  compose.hidden = false
  compareView.hidden = true
  originalInput.focus()
}

function showCompare() {
  const result = compareTexts(originalInput.value, changedInput.value)
  if (result.empty) {
    showCompose()
    showNotice('Paste the two texts you want to compare.')
    originalInput.focus()
    return
  }

  showNotice(null)
  renderDiff(board, result)
  summary.textContent = formatSummary(result)
  compose.hidden = true
  compareView.hidden = false
  summary.focus()
}

function loadExample() {
  originalInput.value = EXAMPLE_ORIGINAL
  changedInput.value = EXAMPLE_CHANGED
  refreshCounts()
  showCompare()
}

function swapTexts() {
  const previous = originalInput.value
  originalInput.value = changedInput.value
  changedInput.value = previous
  refreshCounts()
  if (!compareView.hidden) showCompare()
}

function clearTexts() {
  originalInput.value = ''
  changedInput.value = ''
  refreshCounts()
  showNotice(null)
  showCompose()
}

originalInput.addEventListener('input', refreshCounts)
changedInput.addEventListener('input', refreshCounts)
compareBtn.addEventListener('click', showCompare)
exampleBtn.addEventListener('click', loadExample)
for (const button of document.querySelectorAll('[data-action="swap"]')) {
  button.addEventListener('click', swapTexts)
}
clearBtn.addEventListener('click', clearTexts)
editBtn.addEventListener('click', showCompose)

window.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return
  event.preventDefault()
  if (compareView.hidden) showCompare()
  else showCompose()
})

refreshCounts()
