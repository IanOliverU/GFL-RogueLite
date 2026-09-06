import { expect, test, type Page } from '@playwright/test'

async function snapshot(page: Page) {
  return JSON.parse((await page.locator('canvas').getAttribute('data-playground'))!) as {
    status: string; player: { x: number; z: number }; enemies: { x: number; z: number }[]
  }
}

async function startSabrina(page: Page, params: string) {
  await page.goto(params)
  await page.getByRole('button', { name: 'Select Sabrina', exact: true }).click()
  await page.getByRole('button', { name: 'Start run' }).click()
  await expect(page.locator('canvas')).toHaveAttribute('data-playground', /player/)
  await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
}

/** Pause overlay must sit clear of the HUD box. */
async function checkPauseClearance(page: Page) {
  const pause = page.getByRole('button', { name: 'Pause Esc' })
  await expect(pause).toBeVisible()
  await expect(pause).toBeEnabled()
  const pauseBox = (await pause.boundingBox())!
  const hudBox = (await page.locator('.combat-hud').boundingBox())!
  expect(pauseBox.y + pauseBox.height).toBeLessThanOrEqual(hudBox.y)
}

/** XP strip keeps its dedicated full-width row below the HUD info. */
async function checkXpRow(page: Page) {
  const hud = page.locator('.combat-hud')
  const strip = page.locator('.xp-strip')
  const stripBox = (await strip.boundingBox())!
  const cells = hud.locator(':scope > div:not(.xp-strip)')
  for (let i = 0; i < (await cells.count()); i++) {
    const box = (await cells.nth(i).boundingBox())!
    expect(stripBox.y).toBeGreaterThanOrEqual(box.y + box.height)
  }
}

test.describe('run chrome', () => {
  test.describe('desktop width', () => {
    test.use({ viewport: { width: 1280, height: 800 } })

    test('header and footer hide in runs; pause overlay stays clear', async ({ page }) => {
      test.setTimeout(180000)
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto('/?inspect=1&devxp=5')
      await expect(page.locator('.topbar')).toBeVisible()
      await page.screenshot({ path: 'test-results/menu-desktop.png' })
      await page.getByRole('button', { name: 'Select Sabrina', exact: true }).click()
      await page.getByRole('button', { name: 'Start run' }).click()
      await expect(page.locator('canvas')).toHaveAttribute('data-playground', /player/)

      // Level-up opens immediately from the dev bonus: chrome already hidden.
      await expect(page.getByRole('heading', { name: 'Choose an upgrade' })).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.topbar')).toBeHidden()
      expect(await page.locator('footer').count()).toBe(0)
      await page.locator('.levelup-card').getByRole('button').first().click()
      await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
      await expect(page.locator('.topbar')).toBeHidden()
      expect(await page.locator('footer').count()).toBe(0)
      await checkPauseClearance(page)
      await checkXpRow(page)
      await page.screenshot({ path: 'test-results/m4-chrome-desktop.png' })

      // Pause keeps chrome hidden and shows the control instructions.
      await page.getByRole('button', { name: 'Pause Esc' }).click()
      await expect(page.getByRole('heading', { name: 'Run paused' })).toBeVisible()
      await expect(page.locator('.topbar')).toBeHidden()
      const hints = page.locator('.control-hints')
      await expect(hints).toBeVisible()
      await expect(hints).toContainText('Move')
      await expect(hints).toContainText('Dash')
      await expect(hints).toContainText('Auto-fire in enemy range')
      await page.screenshot({ path: 'test-results/m4-chrome-pause.png' })
      await page.getByRole('button', { name: 'Resume run' }).click()
      await expect.poll(async () => (await snapshot(page)).status).toBe('playing')

      // Walk into the nearest enemy while aiming at a corner so shots miss:
      // real contact ends the run, game over keeps chrome hidden, retry
      // restores play without it.
      await page.mouse.move(1270, 790)
      const keys = ['KeyW', 'KeyA', 'KeyS', 'KeyD'] as const
      const start = Date.now()
      while (Date.now() - start < 100000) {
        if (await page.getByRole('heading', { name: 'Game over', exact: true }).isVisible()) break
        if (await page.locator('.levelup-card').isVisible()) {
          await page.locator('.levelup-card').getByRole('button').first().click()
          await page.waitForTimeout(400)
          continue
        }
        const state = await snapshot(page)
        let target = { x: 0, z: -19 }
        let nearest = Infinity
        for (const enemy of state.enemies) {
          const distance = Math.hypot(enemy.x - state.player.x, enemy.z - state.player.z)
          if (distance < nearest) { nearest = distance; target = enemy }
        }
        const want = new Set<string>()
        if (target.x > state.player.x + 0.3) want.add('KeyD')
        if (target.x < state.player.x - 0.3) want.add('KeyA')
        if (target.z > state.player.z + 0.3) want.add('KeyS')
        if (target.z < state.player.z - 0.3) want.add('KeyW')
        for (const key of keys) {
          if (want.has(key)) await page.keyboard.down(key)
          else await page.keyboard.up(key)
        }
        await page.waitForTimeout(200)
      }
      for (const key of keys) await page.keyboard.up(key)
      await expect(page.getByRole('heading', { name: 'Game over', exact: true })).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.topbar')).toBeHidden()
      expect(await page.locator('footer').count()).toBe(0)
      await page.getByRole('button', { name: 'Retry with Sabrina', exact: true }).click()
      await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
      await expect(page.locator('.topbar')).toBeHidden()

      // Returning to selection restores the header layout.
      await page.keyboard.press('Escape')
      await expect(page.getByRole('heading', { name: 'Run paused' })).toBeVisible()
      await page.getByRole('button', { name: 'Change character' }).click()
      await expect(page.locator('.topbar')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Start run' })).toBeVisible()
      expect(errors).toEqual([])
    })
  })

  test.describe('narrow width', () => {
    test.use({ viewport: { width: 640, height: 800 } })

    test('overlay pause and hud stay usable without overlap', async ({ page }) => {
      test.setTimeout(90000)
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto('/?inspect=1')
      await expect(page.getByRole('button', { name: 'Start run' })).toBeVisible()
      await page.screenshot({ path: 'test-results/menu-narrow.png' })
      await startSabrina(page, '/?inspect=1')
      await expect(page.locator('.topbar')).toBeHidden()
      expect(await page.locator('footer').count()).toBe(0)
      await checkPauseClearance(page)
      await checkXpRow(page)
      await page.screenshot({ path: 'test-results/m4-chrome-narrow.png' })
      await page.getByRole('button', { name: 'Pause Esc' }).click()
      await expect(page.getByRole('heading', { name: 'Run paused' })).toBeVisible()
      await expect(page.locator('.control-hints')).toBeVisible()
      await page.screenshot({ path: 'test-results/m4-chrome-pause-narrow.png' })
      expect(errors).toEqual([])
    })
  })
})
