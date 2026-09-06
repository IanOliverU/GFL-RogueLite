import { expect, test, type Page } from '@playwright/test'

async function snapshot(page: Page) {
  return JSON.parse((await page.locator('canvas').getAttribute('data-playground'))!) as {
    status: string; health: number; elapsed: number; player: { x: number; z: number }
  }
}
async function hudTime(page: Page): Promise<string> {
  const hud = page.locator('.combat-hud')
  await expect(hud).toBeVisible()
  return (await hud.getByText(/^TIME/).textContent()) ?? ''
}
async function startSelected(page: Page) {
  await page.getByRole('button', { name: 'Start run' }).click()
  await expect(page.locator('canvas')).toHaveAttribute('data-playground', /player/)
  if (await page.getByRole('button', { name: 'Resume run' }).isVisible()) await page.getByRole('button', { name: 'Resume run' }).click()
  await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
}

test('pause menu: timer, resume, restart and change character', async ({ page }) => {
  test.setTimeout(90000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/?inspect=1')
  await page.getByRole('button', { name: 'Select Sabrina', exact: true }).click()
  await startSelected(page)

  // Timer starts at 00:00 and advances during play.
  expect(await hudTime(page)).toContain('00:00')
  await expect.poll(async () => (await snapshot(page)).elapsed, { timeout: 8000 }).toBeGreaterThan(1.5)
  expect(await hudTime(page)).not.toContain('00:00')

  // Pause freezes the timer; resume preserves the run.
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: 'Run paused' })).toBeVisible()
  await page.screenshot({ path: 'test-results/m3-pause-menu.png' })
  const pausedElapsed = (await snapshot(page)).elapsed
  const pausedTime = await hudTime(page)
  await page.waitForTimeout(1200)
  expect((await snapshot(page)).elapsed).toBe(pausedElapsed)
  expect(await hudTime(page)).toBe(pausedTime)

  await page.getByRole('button', { name: 'Resume run' }).click()
  await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
  await expect.poll(async () => (await snapshot(page)).elapsed).toBeGreaterThan(pausedElapsed)

  // Restart from pause keeps the doll with a fresh run.
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: 'Run paused' })).toBeVisible()
  await page.getByRole('button', { name: 'Restart run' }).click()
  await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
  const restarted = await snapshot(page)
  expect(restarted.health).toBe(100)
  expect(restarted.elapsed).toBeLessThan(1)
  expect(await hudTime(page)).toContain('00:00')

  // Change character returns to selection for a clean run with another doll.
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: 'Run paused' })).toBeVisible()
  await page.getByRole('button', { name: 'Change character' }).click()
  await expect(page.getByRole('button', { name: 'Start run' })).toBeVisible()
  await page.getByRole('button', { name: 'Select Vepley', exact: true }).click()
  await startSelected(page)
  const switched = await snapshot(page)
  expect(switched.health).toBe(100)
  expect(switched.elapsed).toBeLessThan(1)
  expect(await hudTime(page)).toContain('00:00')
  expect(errors).toEqual([])
})
