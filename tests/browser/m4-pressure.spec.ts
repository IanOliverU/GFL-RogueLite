import { expect, test, type Page } from '@playwright/test'

interface PressureSnapshot {
  status: string; health: number; maxHealth: number; elapsed: number
  level: number; kills: number; gemsCollected: number
  player: { x: number; z: number }
  enemies: { kind: string }[]
  enemiesScreen: { id: number; x: number; y: number }[]
}
async function snapshot(page: Page): Promise<PressureSnapshot> {
  return JSON.parse((await page.locator('canvas').getAttribute('data-playground'))!) as PressureSnapshot
}

/**
 * Sustained run into phase 3 (60 s+): kite a square, track the nearest enemy
 * with the cursor, and drain level-up dialogs with gun/vest-first picks.
 */
test('pressure phases sustain density with readable ranged counts', async ({ page }) => {
  test.setTimeout(180000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/?inspect=1&devxp=60')
  await page.getByRole('button', { name: 'Select Sabrina', exact: true }).click()
  await page.getByRole('button', { name: 'Start run' }).click()
  await expect(page.locator('canvas')).toHaveAttribute('data-playground', /player/)

  const legs = [['KeyW'], ['KeyD'], ['KeyS'], ['KeyA']] as const
  const allKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD'] as const
  let legIndex = -1
  let legStarted = 0
  let maxEnemies = 0
  let maxRanged = 0
  const start = Date.now()
  // M5 120 x 96 map: far spawns need travel time, so sustain the run deeper
  // into phase 3 to give the kill stream the same engagement budget.
  while (Date.now() - start < 115000) {
    const state = await snapshot(page)
    if (state.status === 'game_over') break;
    maxEnemies = Math.max(maxEnemies, state.enemies.length)
    maxRanged = Math.max(maxRanged, state.enemies.filter((enemy) => enemy.kind === 'ranged').length)
    if (state.elapsed >= 80) break
    const dialog = page.locator('.levelup-card')
    if (await dialog.isVisible()) {
      if (await page.getByRole('button', { name: /Broad shotgun/ }).isVisible()) {
        await page.getByRole('button', { name: /Broad shotgun/ }).click()
      } else if (await page.getByRole('button', { name: /Plated Vest/ }).isVisible()) {
        await page.getByRole('button', { name: /Plated Vest/ }).click()
      } else {
        await dialog.getByRole('button').first().click()
      }
      await page.waitForTimeout(400) // Let the fresh choice set commit.
      continue
    }
    if (state.status !== 'playing') {
      await page.waitForTimeout(300)
      continue
    }
    // M5 120 x 96 map: enemies arrive from far spawns in every direction, so
    // aim at the nearest enemy to the screen centre (the player) instead of
    // the oldest one, which may be a distant walker.
    if (state.enemiesScreen.length > 0) {
      let best = state.enemiesScreen[0]
      let bestDistance = Math.hypot(best.x - 640, best.y - 400)
      for (const candidate of state.enemiesScreen) {
        const distance = Math.hypot(candidate.x - 640, candidate.y - 400)
        if (distance < bestDistance) { best = candidate; bestDistance = distance }
      }
      await page.mouse.move(best.x, best.y)
    }
    const leg = Math.floor((Date.now() - start) / 2000) % legs.length
    if (leg !== legIndex) {
      legIndex = leg
      legStarted = Date.now()
      for (const key of allKeys) {
        if ((legs[leg] as readonly string[]).includes(key)) await page.keyboard.down(key)
        else await page.keyboard.up(key)
      }
    }
    void legStarted
    await page.waitForTimeout(250)
  }
  for (const key of allKeys) await page.keyboard.up(key)

  const end = await snapshot(page)
  expect(end.elapsed).toBeGreaterThanOrEqual(80)
  // Lethal builds suppress the live count, so density and throughput agree:
  // several enemies up at once plus a steady kill stream through phase 2+.
  expect(maxEnemies).toBeGreaterThanOrEqual(7)
  expect(end.kills).toBeGreaterThanOrEqual(12)
  expect(maxRanged).toBeLessThanOrEqual(2)
  expect(end.gemsCollected).toBeGreaterThanOrEqual(1)
  expect(end.level).toBeGreaterThanOrEqual(2)
  await page.screenshot({ path: 'test-results/m4-pressure.png' })
  expect(errors).toEqual([])
})
