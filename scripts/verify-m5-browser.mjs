/* global console, process */
import { chromium } from 'playwright'

async function snapshot(page) {
  return JSON.parse(await page.locator('canvas').getAttribute('data-playground'))
}

async function move(page, key, milliseconds) {
  await page.keyboard.down(key)
  await page.waitForTimeout(milliseconds)
  await page.keyboard.up(key)
  await page.waitForTimeout(100)
}

async function run() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('http://127.0.0.1:4173/?inspect=1', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Select Sabrina', exact: true }).click()
  await page.getByRole('button', { name: 'Start run' }).click()
  await page.locator('canvas').waitFor()
  await page.locator('canvas').hover({ position: { x: 240, y: 600 } })
  await move(page, 'KeyW', 1050)
  await move(page, 'KeyD', 2050)
  await move(page, 'KeyW', 2100)
  await move(page, 'KeyA', 2950)
  const checkpoint = await snapshot(page)
  await page.screenshot({ path: 'test-results/m5-checkpoint-playing.png' })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(150)
  const paused = await snapshot(page)
  if (paused.status !== 'paused') throw new Error(`Pause verification failed: ${paused.status}`)
  await page.screenshot({ path: 'test-results/m5-checkpoint.png' })
  console.log(JSON.stringify({ checkpoint, pausedStatus: paused.status, errors }, null, 2))
  await browser.close()
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
