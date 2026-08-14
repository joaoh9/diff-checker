import { chromium } from 'playwright-core'

const url = process.argv[2] ?? 'http://127.0.0.1:5174/'
const executablePath = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'

const browser = await chromium.launch({
  executablePath,
  headless: true,
})

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const failures = []

function assert(condition, message) {
  if (!condition) failures.push(message)
}

try {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Find difference' }).waitFor()

  await page.getByRole('button', { name: 'Find difference' }).click()
  assert(
    (await page.locator('#notice').innerText()) === 'Paste the two texts you want to compare.',
    'empty compare should show a paste notice',
  )

  await page.getByRole('button', { name: 'Try example' }).click()
  await page.locator('#diff-board .diff-row').first().waitFor()
  const summary = await page.locator('#summary').innerText()
  assert(summary.includes('changed'), `example summary should mention changes, got: ${summary}`)
  assert(
    (await page.locator('.token-remove').count()) > 0,
    'example should mark removed words',
  )
  assert(
    (await page.locator('.token-add').count()) > 0,
    'example should mark added words',
  )
  await page.screenshot({ path: '/tmp/diff-checker-result.png', fullPage: true })

  await page.locator('#compare [data-action="swap"]').click()
  const swapped = await page.locator('#summary').innerText()
  assert(swapped.includes('changed'), `swap should still show a diff, got: ${swapped}`)

  await page.getByRole('button', { name: 'Edit texts' }).click()
  assert(await page.locator('#original').isVisible(), 'edit should return to the original pane')
  const original = await page.locator('#original').inputValue()
  assert(original.includes('Wednesday'), 'swap should have moved the changed text into Original')

  await page.getByRole('button', { name: 'Clear' }).click()
  assert((await page.locator('#original').inputValue()) === '', 'clear should empty original')
  assert((await page.locator('#changed').inputValue()) === '', 'clear should empty changed')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Try example' }).click()
  await page.locator('#diff-board .diff-row').first().waitFor()
  const boardBox = await page.locator('#diff-board').boundingBox()
  assert(boardBox && boardBox.width > 200, 'mobile compare view should still render a board')
  await page.screenshot({ path: '/tmp/diff-checker-mobile.png', fullPage: true })
} finally {
  await browser.close()
}

if (failures.length) {
  console.error(failures.map((item) => `FAIL ${item}`).join('\n'))
  process.exit(1)
}

console.log('SMOKE OK')
