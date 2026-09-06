import { expect, test, type Page } from '@playwright/test'

interface M3Snapshot {
  status: string; health: number; elapsed: number
  player: { x: number; z: number }
  dash: { remaining: number; cooldown: number }
  dashes: number; enemyShots: number; dodgedShots: number
  hostileProjectiles: unknown[]
  enemies: { id: number; kind: string; attack: { remaining: number } | null }[]
  held: string[]
}
async function snapshot(page: Page): Promise<M3Snapshot> {
  return JSON.parse((await page.locator('canvas').getAttribute('data-playground'))!) as M3Snapshot
}
async function startSelected(page: Page) {
  await page.getByRole('button', { name: 'Start run' }).click()
  await expect(page.locator('canvas')).toHaveAttribute('data-playground', /player/)
  if (await page.getByRole('button', { name: 'Resume run' }).isVisible()) await page.getByRole('button', { name: 'Resume run' }).click()
  await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
}

test('dash moves west, cools down, freezes in pause and resets on retry', async ({ page }) => {
  test.setTimeout(60000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/?inspect=1')
  await page.getByRole('button', { name: 'Select Sabrina', exact: true }).click()
  await startSelected(page)
  const before = await snapshot(page)
  expect(before.dashes).toBe(0)

  await page.keyboard.down('KeyA') // West: the eastern cover block would stop an eastward dash at 3.1.
  await page.keyboard.press('Space')
  await page.screenshot({ path: 'test-results/m3-dash.png' })
  await expect.poll(async () => (await snapshot(page)).dashes).toBe(1)
  expect((await snapshot(page)).dash.cooldown).toBeGreaterThan(0)
  await page.waitForTimeout(350)
  const after = await snapshot(page)
  expect(after.dash.remaining).toBe(0)
  // Dash plus held movement covers far more ground than walking alone.
  expect(after.player.x).toBeLessThan(before.player.x - 3.5)

  await page.keyboard.press('Space') // Still cooling down.
  await page.waitForTimeout(120)
  expect((await snapshot(page)).dashes).toBe(1)
  expect((await snapshot(page)).held).toContain('KeyA')

  await page.keyboard.up('KeyA')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: 'Run paused' })).toBeVisible()
  const paused = await snapshot(page)
  const frozenCooldown = paused.dash.cooldown
  expect(frozenCooldown).toBeGreaterThan(0)
  await page.waitForTimeout(250)
  expect((await snapshot(page)).dash.cooldown).toBe(frozenCooldown)
  expect((await snapshot(page)).held).toEqual([])

  await page.getByRole('button', { name: 'Resume run' }).click()
  await expect.poll(async () => (await snapshot(page)).dash.cooldown, { timeout: 4000 }).toBeLessThan(frozenCooldown)

  // Stationary player with no aim input: enemy pressure ends the run.
  await expect(page.getByRole('heading', { name: 'Game over', exact: true })).toBeVisible({ timeout: 30000 })
  await page.getByRole('button', { name: 'Retry with Sabrina', exact: true }).click()
  await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
  const retry = await snapshot(page)
  expect(retry.health).toBe(100)
  expect(retry.dashes).toBe(0)
  expect(retry.dash.remaining).toBe(0)
  expect(retry.dash.cooldown).toBe(0)
  expect(retry.hostileProjectiles).toEqual([])
  expect(retry.enemyShots).toBe(0)
  expect(retry.dodgedShots).toBe(0)
  expect(errors).toEqual([])
})

test('ranged enemy telegraphs a warning, fires a slow shot and the hit lands', async ({ page }) => {
  test.setTimeout(60000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/?inspect=1')
  await page.getByRole('button', { name: 'Select Sabrina', exact: true }).click()
  await startSelected(page)
  await page.mouse.move(640, 560) // Aim near the opening pursuer so it dies early; Sabrina's short range cannot reach a holding ranged enemy.

  await expect.poll(async () => (await snapshot(page)).enemies.some((enemy) => enemy.kind === 'ranged'), { timeout: 15000 }).toBe(true)
  await expect.poll(async () => (await snapshot(page)).enemies.some((enemy) => enemy.kind === 'ranged' && enemy.attack !== null), { timeout: 20000 }).toBe(true)

  // Capture the telegraph while playing; the pause dialog would cover the arena.
  await page.screenshot({ path: 'test-results/m3-warning.png' })
  // Re-acquire a fresh warning: the captured one may have fired during the screenshot.
  await expect.poll(async () => (await snapshot(page)).enemies.some((enemy) => enemy.kind === 'ranged' && enemy.attack !== null), { timeout: 20000 }).toBe(true)
  // Freeze the warning for a stable timer assertion.
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: 'Run paused' })).toBeVisible()
  const frozenWarning = (await snapshot(page)).enemies.find((enemy) => enemy.kind === 'ranged')!.attack!.remaining
  await page.waitForTimeout(250)
  expect((await snapshot(page)).enemies.find((enemy) => enemy.kind === 'ranged')!.attack!.remaining).toBe(frozenWarning)
  await page.getByRole('button', { name: 'Resume run' }).click()

  await expect.poll(async () => (await snapshot(page)).hostileProjectiles.length, { timeout: 10000 }).toBeGreaterThan(0)
  await page.screenshot({ path: 'test-results/m3-projectile.png' })
  await expect.poll(async () => (await snapshot(page)).hostileProjectiles.length, { timeout: 8000 }).toBe(0)
  // The ranged enemy keeps firing on its recovery cycle; at least the first shot landed.
  expect((await snapshot(page)).enemyShots).toBeGreaterThanOrEqual(1)
  expect(errors).toEqual([])
})
