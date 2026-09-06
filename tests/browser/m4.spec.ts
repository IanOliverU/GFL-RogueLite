import { expect, test, type Locator, type Page } from '@playwright/test'

interface M4Snapshot {
  status: string; health: number; elapsed: number; level: number; xp: number
  pendingLevels: number; gemsCollected: number; evolution: boolean
  player: { x: number; z: number }
  gems: { x: number; z: number; value: number }[]
  enemiesScreen: { id: number; x: number; y: number }[]
}
async function snapshot(page: Page): Promise<M4Snapshot> {
  return JSON.parse((await page.locator('canvas').getAttribute('data-playground'))!) as M4Snapshot
}
async function startRun(page: Page) {
  await page.getByRole('button', { name: 'Start run' }).click()
  await expect(page.locator('canvas')).toHaveAttribute('data-playground', /player/)
}
async function selectSabrina(page: Page) {
  await page.getByRole('button', { name: 'Select Sabrina', exact: true }).click()
}

/** Keep the cursor on the first live enemy so auto-fire stays engaged. */
async function aimAtFirstEnemy(page: Page, stop: () => Promise<boolean>, timeoutMs: number) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const state = await snapshot(page)
    if (state.status !== 'playing' || (await stop())) return
    if (state.enemiesScreen.length > 0) await page.mouse.move(state.enemiesScreen[0].x, state.enemiesScreen[0].y)
    await page.waitForTimeout(300)
  }
}

/**
 * Click a choice and verify it applied (dialog closed or queued count fell);
 * retries when React replaced the button mid-click-sequence.
 */
async function clickVerified(page: Page, button: Locator, timeoutMs = 8000) {
  const dialog = page.locator('.levelup-card')
  const before = (await snapshot(page)).pendingLevels
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (!(await dialog.isVisible())) return
    await button.click({ timeout: 2000 })
    try {
      await expect.poll(async () => {
        if (!(await dialog.isVisible())) return -1
        return (await snapshot(page)).pendingLevels
      }, { timeout: 2000 }).toBeLessThan(before)
      return
    } catch {
      // Click lost to a re-render; loop retries against the fresh buttons.
    }
  }
  throw new Error('choice did not apply in time')
}

/** Walk toward the first dropped gem until one is collected (or play stops). */
async function walkToGem(page: Page, timeoutMs: number) {
  const start = Date.now()
  const keys = ['KeyW', 'KeyA', 'KeyS', 'KeyD'] as const
  while (Date.now() - start < timeoutMs) {
    const state = await snapshot(page)
    if (state.gemsCollected >= 1 || state.status !== 'playing') return state
    if (state.gems.length > 0) {
      const dx = state.gems[0].x - state.player.x, dz = state.gems[0].z - state.player.z
      const want = new Set<string>()
      if (dx > 0.2) want.add('KeyD')
      if (dx < -0.2) want.add('KeyA')
      if (dz > 0.2) want.add('KeyS')
      if (dz < -0.2) want.add('KeyW')
      for (const key of keys) {
        if (want.has(key)) await page.keyboard.down(key)
        else await page.keyboard.up(key)
      }
    }
    await page.waitForTimeout(150)
  }
  for (const key of keys) await page.keyboard.up(key)
  return snapshot(page)
}

test('natural kill drops a gem; walking over it grants xp with a visible bar', async ({ page }) => {
  test.setTimeout(90000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/?inspect=1')
  await selectSabrina(page)
  await startRun(page)
  await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
  // Track the opening pursuer with the cursor so auto-fire kills it.
  await aimAtFirstEnemy(page, async () => (await snapshot(page)).gems.length > 0, 25000)
  expect(await snapshot(page).then((state) => state.gems.length)).toBeGreaterThan(0)
  await page.screenshot({ path: 'test-results/m4-gems.png' })
  const collected = await walkToGem(page, 25000)
  expect(collected.gemsCollected).toBeGreaterThanOrEqual(1)
  expect(collected.xp).toBeGreaterThan(0)
  await expect(page.locator('.xp-strip')).toBeVisible()
  expect(errors).toEqual([])
})

test('level-up pauses the run, freezes the timer and applies the chosen upgrade', async ({ page }) => {
  test.setTimeout(90000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/?inspect=1&devxp=5')
  await selectSabrina(page)
  await startRun(page)

  await expect(page.getByRole('heading', { name: 'Choose an upgrade' })).toBeVisible({ timeout: 15000 })
  await page.screenshot({ path: 'test-results/m4-levelup.png' })
  // The run clock is frozen while choosing.
  const frozen = (await snapshot(page)).elapsed
  await page.waitForTimeout(1200)
  expect((await snapshot(page)).elapsed).toBe(frozen)
  expect((await snapshot(page)).status).toBe('levelup')

  await clickVerified(page, page.getByRole('button', { name: /Broad shotgun/ }))
  await expect(page.getByRole('heading', { name: 'Choose an upgrade' })).toBeHidden({ timeout: 5000 })
  await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
  await expect(page.locator('.combat-hud')).toContainText('LV 2')
  // The clock resumes with the run.
  await expect.poll(async () => (await snapshot(page)).elapsed).toBeGreaterThan(frozen)
  expect(errors).toEqual([])
})

test('evolution unlocks through normal choices and resets on restart', async ({ page }) => {
  test.setTimeout(120000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/?inspect=1&devxp=200')
  await selectSabrina(page)
  await startRun(page)
  await expect(page.getByRole('heading', { name: 'Choose an upgrade' })).toBeVisible({ timeout: 15000 })

  for (let pick = 0; pick < 20; pick++) {
    if (!(await page.locator('.levelup-card').isVisible())) break
    // Settle: decide only against the freshly committed choice set.
    await page.waitForTimeout(400)
    if (!(await page.locator('.levelup-card').isVisible())) break
    if (await page.getByRole('button', { name: /Shockwave Barrage/ }).isVisible()) {
      await clickVerified(page, page.getByRole('button', { name: /Shockwave Barrage/ }))
    } else if (await page.getByRole('button', { name: /Broad shotgun/ }).isVisible()) {
      await clickVerified(page, page.getByRole('button', { name: /Broad shotgun/ }))
    } else if (await page.getByRole('button', { name: /Plated Vest/ }).isVisible()) {
      await clickVerified(page, page.getByRole('button', { name: /Plated Vest/ }))
    } else {
      await clickVerified(page, page.locator('.levelup-card').getByRole('button').first())
    }
  }
  await expect(page.locator('.levelup-card')).toBeHidden({ timeout: 10000 })
  await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
  expect((await snapshot(page)).evolution).toBe(true)
  await expect(page.locator('.combat-hud')).toContainText('EVO')
  await page.screenshot({ path: 'test-results/m4-evolution.png' })

  // Restarting clears every trace of the evolved build.
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: 'Run paused' })).toBeVisible()
  await page.getByRole('button', { name: 'Restart run' }).click()
  await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
  const fresh = await snapshot(page)
  expect(fresh.level).toBe(1)
  expect(fresh.xp).toBe(0)
  expect(fresh.pendingLevels).toBe(0)
  expect(fresh.evolution).toBe(false)
  await expect(page.locator('.combat-hud')).toContainText('LV 1')
  await expect(page.locator('.combat-hud')).not.toContainText('EVO')
  expect(errors).toEqual([])
})
