import { expect, test, type Page } from '@playwright/test'

async function snapshot(page: Page) {
  return JSON.parse((await page.locator('canvas').getAttribute('data-playground'))!) as {
    status: string; xp: number
  }
}

async function checkXpBar(page: Page, shot: string) {
  await page.goto('/?inspect=1&devxp=2')
  await page.getByRole('button', { name: 'Select Sabrina', exact: true }).click()
  await page.getByRole('button', { name: 'Start run' }).click()
  await expect(page.locator('canvas')).toHaveAttribute('data-playground', /player/)
  await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
  const hud = page.locator('.combat-hud')
  const strip = page.locator('.xp-strip')
  await expect(hud).toBeVisible()
  await expect(strip).toBeVisible()

  const hudBox = (await hud.boundingBox())!
  const stripBox = (await strip.boundingBox())!
  // Track spans the full inner width: inside the padded container box.
  expect(stripBox.x).toBeGreaterThanOrEqual(hudBox.x)
  expect(stripBox.x + stripBox.width).toBeLessThanOrEqual(hudBox.x + hudBox.width)
  expect(stripBox.width).toBeGreaterThan(hudBox.width / 2)

  // Dedicated row beneath every info cell: below all cells with ~8px spacing,
  // overlapping nothing (labels like AUTO · ENEMY IN RANGE and SPACE included).
  const cells = hud.locator(':scope > div:not(.xp-strip)')
  const cellBottoms: number[] = []
  for (let i = 0; i < (await cells.count()); i++) {
    const box = (await cells.nth(i).boundingBox())!
    cellBottoms.push(box.y + box.height)
    expect(stripBox.y).toBeGreaterThanOrEqual(box.y + box.height)
  }
  const gap = stripBox.y - Math.max(...cellBottoms)
  expect(gap).toBeGreaterThanOrEqual(6)
  expect(gap).toBeLessThanOrEqual(12)

  // Values and fill behavior are unchanged: 2 of 5 XP renders at 40%.
  expect(await strip.getAttribute('aria-label')).toBe('Experience 2 of 5')
  const fill = strip.locator('i')
  expect(await fill.evaluate((node) => node.style.width)).toBe('40%')
  await page.screenshot({ path: shot })
}

test.describe('xp bar layout', () => {
  test.describe('desktop width', () => {
    test.use({ viewport: { width: 1280, height: 800 } })
    test('bar sits in its own full-width row below the hud info', async ({ page }) => {
      test.setTimeout(60000)
      await checkXpBar(page, 'test-results/m4-hud-desktop.png')
    })
  })

  test.describe('narrow width', () => {
    test.use({ viewport: { width: 640, height: 800 } })
    test('bar stays below wrapped hud rows without overlapping labels', async ({ page }) => {
      test.setTimeout(60000)
      await checkXpBar(page, 'test-results/m4-hud-narrow.png')
    })
  })
})
