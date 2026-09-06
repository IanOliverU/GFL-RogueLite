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
  while (Date.now() - start < 100000) {
    const state = await snapshot(page)
    if (state.status === 'game_over') break
    maxEnemies = Math.max(maxEnemies, state.enemies.length)
    maxRanged = Math.max(maxRanged, state.enemies.filter((enemy) => enemy.kind === 'ranged').length)
    if (state.elapsed >= 70) break
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
    if (state.enemiesScreen.length > 0) await page.mouse.move(state.enemiesScreen[0].x, state.enemiesScreen[0].y)
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
  expect(end.elapsed).toBeGreaterThanOrEqual(70)
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
