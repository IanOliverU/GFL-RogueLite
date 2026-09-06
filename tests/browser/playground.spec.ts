import { expect, test, type Page } from '@playwright/test'

interface Snapshot {
  player: { x: number; z: number }
  aimTarget: { x: number; z: number } | null
  aimDirection: { x: number; z: number }
  elapsed: number
  status: string
  held: string[]
  camera: number[]
  targetScreen: { x: number; y: number }
}

async function snapshot(page: Page): Promise<Snapshot> {
  return JSON.parse((await page.locator('canvas').getAttribute('data-playground'))!) as Snapshot
}

async function start(page: Page) {
  await page.goto('/?inspect=1')
  await expect(page.locator('canvas')).toHaveAttribute('data-playground', /player/)
  if (await page.getByRole('dialog').isVisible()) await page.getByRole('button', { name: 'Resume playground' }).click()
  await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
}

async function expectCursorAlignment(page: Page, x: number, y: number) {
  await expect.poll(async () => {
    const state = await snapshot(page)
    return Math.hypot(state.targetScreen.x - x, state.targetScreen.y - y)
  }).toBeLessThan(0.1)
  const state = await snapshot(page)
  const dx = state.aimTarget!.x - state.player.x
  const dz = state.aimTarget!.z - state.player.z
  expect(state.aimDirection.x).toBeCloseTo(dx / Math.hypot(dx, dz), 6)
  expect(state.aimDirection.z).toBeCloseTo(dz / Math.hypot(dx, dz), 6)
}

test('production scene: all-around aiming, stationary cursor during movement, resize and boundaries', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await start(page)
  for (const [x, y] of [[450, 240], [820, 240], [450, 570], [820, 570]]) {
    await page.mouse.move(x, y)
    await expectCursorAlignment(page, x, y)
  }
  const before = await snapshot(page)
  await page.keyboard.down('KeyD')
  await expect.poll(async () => (await snapshot(page)).player.x).toBeGreaterThan(3)
  await page.keyboard.up('KeyD')
  await expectCursorAlignment(page, 820, 570)
  const after = await snapshot(page)
  expect(after.camera[0]).toBeGreaterThan(before.camera[0])
  expect(after.aimTarget!.x).toBeGreaterThan(before.aimTarget!.x)
  await page.screenshot({ path: 'test-results/m1-moving-aim.png' })
  await page.setViewportSize({ width: 960, height: 700 })
  await expectCursorAlignment(page, 820, 570)
  await page.screenshot({ path: 'test-results/m1-resized.png' })
  await page.keyboard.down('KeyD')
  await expect.poll(async () => (await snapshot(page)).player.x, { timeout: 8000 }).toBe(11.6)
  await page.keyboard.up('KeyD')
  expect(errors).toEqual([])
})

test('pause button and Escape clear held inputs and stop simulation until deliberate resume', async ({ page }) => {
  await start(page)
  await page.keyboard.down('KeyW')
  await expect.poll(async () => (await snapshot(page)).player.z).toBeLessThan(-0.5)
  await page.getByRole('button', { name: 'Pause Esc' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  const paused = await snapshot(page)
  expect(paused.held).toEqual([])
  await page.waitForTimeout(250)
  expect((await snapshot(page)).elapsed).toBe(paused.elapsed)
  await page.keyboard.up('KeyW')
  await page.getByRole('button', { name: 'Resume playground' }).click()
  await page.waitForTimeout(150)
  expect((await snapshot(page)).player).toEqual(paused.player)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.keyboard.down('KeyS')
  await expect.poll(async () => (await snapshot(page)).player.z).toBeGreaterThan(paused.player.z)
  await page.keyboard.up('KeyS')
})

test('focus-loss event clears input and returning focus does not auto-resume', async ({ page }) => {
  await start(page)
  await page.keyboard.down('KeyD')
  await expect.poll(async () => (await snapshot(page)).player.x).toBeGreaterThan(0.5)
  // Deterministic DOM lifecycle event; real OS Alt-Tab remains a director check.
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await expect(page.getByRole('dialog')).toBeVisible()
  const paused = await snapshot(page)
  await page.keyboard.up('KeyD')
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.waitForTimeout(250)
  expect((await snapshot(page)).elapsed).toBe(paused.elapsed)
  expect((await snapshot(page)).held).toEqual([])
  await page.getByRole('button', { name: 'Resume playground' }).click()
  await page.waitForTimeout(150)
  expect((await snapshot(page)).player).toEqual(paused.player)
})
