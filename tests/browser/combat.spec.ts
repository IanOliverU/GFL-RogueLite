import { expect, test, type Page } from '@playwright/test'
import { CHARACTER_LIST, CHARACTERS } from '../../src/game/data/characters'
import { WEAPONS } from '../../src/game/data/weapons'

interface CombatSnapshot {
  dollId: keyof typeof CHARACTERS; status: string; health: number; shots: number; hits: number; kills: number; elapsed: number
  projectiles: unknown[]; held: string[]; enemiesScreen: { id: number; x: number; y: number }[]
  weapon: { ammo: number; cooldown: number; burstRemaining: number; reloadRemaining: number }
}
async function snapshot(page: Page): Promise<CombatSnapshot> {
  return JSON.parse((await page.locator('canvas').getAttribute('data-playground'))!) as CombatSnapshot
}
async function startSelected(page: Page) {
  await page.getByRole('button', { name: 'Start run' }).click()
  await expect(page.locator('canvas')).toHaveAttribute('data-playground', /player/)
  if (await page.getByRole('button', { name: 'Resume run' }).isVisible()) await page.getByRole('button', { name: 'Resume run' }).click()
  await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
}

for (const doll of CHARACTER_LIST) {
  test(`${doll.name}: select, fire, defeat, pause/focus, die and retry`, async ({ page }) => {
    test.setTimeout(45000)
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/?inspect=1')
    await expect(page.getByRole('heading', { name: 'Select your T-Doll' })).toBeVisible()
    for (const option of CHARACTER_LIST) await expect(page.getByRole('button', { name: `Select ${option.name}`, exact: true })).toBeVisible()
    await page.getByRole('button', { name: `Select ${doll.name}`, exact: true }).click()
    await expect(page.getByRole('button', { name: `Select ${doll.name}`, exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText(WEAPONS[doll.weaponId].description, { exact: true })).toBeVisible()
    if (doll.id === 'sabrina') await page.screenshot({ path: 'test-results/m2-selection.png' })
    await startSelected(page)
    expect((await snapshot(page)).dollId).toBe(doll.id)
    expect((await snapshot(page)).shots).toBe(0) // Selection/start button cannot fire behind UI.
    if (doll.id === 'sabrina') await page.screenshot({ path: 'test-results/m2-arena.png' })
    const enemy = (await snapshot(page)).enemiesScreen[0]
    await page.mouse.move(enemy.x, enemy.y)
    await expect.poll(async () => (await snapshot(page)).shots).toBeGreaterThan(0)
    await expect.poll(async () => (await snapshot(page)).kills, { timeout: 8000 }).toBeGreaterThan(0)
    expect((await snapshot(page)).hits).toBeGreaterThan(0)
    await page.screenshot({ path: `test-results/m2-${doll.id}.png` })

    await page.keyboard.down('KeyD')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('heading', { name: 'Run paused' })).toBeVisible()
    const paused = await snapshot(page)
    await page.waitForTimeout(180)
    expect((await snapshot(page)).elapsed).toBe(paused.elapsed)
    expect((await snapshot(page)).weapon).toEqual(paused.weapon)
    expect((await snapshot(page)).held).toEqual([])
    await page.keyboard.up('KeyD')
    await page.getByRole('button', { name: 'Resume run' }).click()
    await page.evaluate(() => window.dispatchEvent(new Event('blur')))
    await expect(page.getByRole('heading', { name: 'Run paused' })).toBeVisible()
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    expect((await snapshot(page)).status).toBe('paused')
    await page.getByRole('button', { name: 'Resume run' }).click()
    await page.mouse.move(30, 30) // No aim input: allow real pursuer contact to end the run.
    await expect(page.getByRole('heading', { name: 'Game over', exact: true })).toBeVisible({ timeout: 25000 })
    const dead = await snapshot(page)
    expect(dead.health).toBe(0)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)
    expect((await snapshot(page)).elapsed).toBe(dead.elapsed)
    expect((await snapshot(page)).status).toBe('game_over')
    await page.getByRole('button', { name: `Retry with ${doll.name}`, exact: true }).click()
    await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
    const retry = await snapshot(page)
    expect(retry.dollId).toBe(doll.id)
    expect(retry.health).toBe(100)
    expect(retry.kills).toBe(0)
    expect(retry.shots).toBe(0)
    expect(retry.projectiles).toEqual([])
    expect(retry.weapon).toEqual({ ammo: WEAPONS[doll.weaponId].magazine, cooldown: 0, reloadRemaining: 0, burstRemaining: 0 })
    expect(errors).toEqual([])
  })
}

test('game over returns to selection and switching dolls starts with a fresh weapon', async ({ page }) => {
  test.setTimeout(30000)
  await page.goto('/?inspect=1')
  await startSelected(page)
  await expect(page.getByRole('heading', { name: 'Game over', exact: true })).toBeVisible({ timeout: 20000 })
  await page.getByRole('button', { name: 'Return to selection' }).click()
  await expect(page.locator('canvas')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: 'Select your T-Doll' })).toBeVisible()
  await page.getByRole('button', { name: 'Select Peritya', exact: true }).click()
  await startSelected(page)
  expect((await snapshot(page)).dollId).toBe('peritya')
  expect((await snapshot(page)).weapon.ammo).toBe(60)
  expect((await snapshot(page)).health).toBe(100)
  expect((await snapshot(page)).shots).toBe(0)
})
