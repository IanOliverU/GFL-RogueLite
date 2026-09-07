import { expect, test, type Page } from '@playwright/test'

interface ThirdPersonSnapshot {
  player: { x: number; z: number }
  status: string
  held: string[]
  shots: number
  kills: number
  enemies: { x: number; z: number }[]
  weapon: { ammo: number }
  thirdperson: {
    yaw: number
    pitch: number
    locked: boolean
    fireHeld: boolean
    aimTarget: { x: number; z: number } | null
  } | null
}

async function snapshot(page: Page): Promise<ThirdPersonSnapshot> {
  return JSON.parse((await page.locator('canvas').getAttribute('data-playground'))!) as ThirdPersonSnapshot
}

async function startThirdPerson(page: Page, doll: string, errors: string[]) {
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/?mode=thirdperson&inspect=1')
  await page.getByRole('button', { name: `Select ${doll}`, exact: true }).click()
  await page.getByRole('button', { name: 'Start run' }).click()
  await expect(page.locator('canvas')).toHaveAttribute('data-playground', /player/)
  await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
}

test('third-person selection offers the three modeled dolls', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/?mode=thirdperson')
  for (const doll of ['Sabrina', 'Mosin-Nagant', 'Qiongjiu']) {
    await expect(page.getByRole('button', { name: `Select ${doll}`, exact: true })).toBeVisible()
  }
  await expect(page.getByRole('button', { name: 'Select Tololo', exact: true })).toHaveCount(0)
  await page.screenshot({ path: 'test-results/tp-selection.png' })
  expect(errors).toEqual([])
})

test('third-person orbit, movement, manual fire and pause cohere', async ({ page }) => {
  const errors: string[] = []
  await startThirdPerson(page, 'Sabrina', errors)
  // Entry overlay is shown until pointer lock engages.
  await expect(page.getByText('Click to enter third-person control')).toBeVisible()
  await page.getByText('Click to enter third-person control').click()
  await expect.poll(async () => (await snapshot(page)).thirdperson?.locked).toBe(true)
  await expect(page.getByText('Click to enter third-person control')).toHaveCount(0)

  const before = await snapshot(page)
  expect(before.thirdperson?.yaw).toBe(0)

  // Synthetic locked-mouse motion orbits the camera (same handler path).
  await page.evaluate(() => {
    for (const [dx, dy] of [[120, 0], [120, 0], [0, 60]]) {
      window.dispatchEvent(new MouseEvent('mousemove', { movementX: dx, movementY: dy, bubbles: true }))
    }
  })
  await expect.poll(async () => (await snapshot(page)).thirdperson?.yaw).toBeLessThan(-0.3)
  const orbited = await snapshot(page)
  expect(orbited.thirdperson!.pitch).toBeGreaterThan(0.31)

  // Movement follows held keys; fire follows the held mouse button.
  await page.keyboard.down('KeyW')
  await expect.poll(async () => (await snapshot(page)).player.z, { timeout: 8000 }).toBeLessThan(-1)
  await page.mouse.down()
  await expect.poll(async () => (await snapshot(page)).thirdperson?.fireHeld).toBe(true)
  const firing = await snapshot(page)
  await expect.poll(async () => (await snapshot(page)).shots, { timeout: 15000 }).toBeGreaterThan(firing.shots)
  await page.mouse.up()
  await page.keyboard.up('KeyW')
  await page.screenshot({ path: 'test-results/tp-sabrina-play.png' })

  // Escape pauses and drops the lock; resume needs a deliberate click.
  await page.keyboard.press('Escape')
  await expect.poll(async () => (await snapshot(page)).status).toBe('paused')
  expect((await snapshot(page)).thirdperson?.locked).toBe(false)
  expect((await snapshot(page)).thirdperson?.fireHeld).toBe(false)
  await page.getByRole('button', { name: /resume run/i }).click()
  await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
  await expect(page.getByText('Click to enter third-person control')).toBeVisible()
  expect(errors).toEqual([])
})

test('third-person renders Sabrina and plays locomotion', async ({ page }) => {
  const errors: string[] = []
  await startThirdPerson(page, 'Sabrina', errors)
  await page.getByText('Click to enter third-person control').click()
  await expect.poll(async () => (await snapshot(page)).thirdperson?.locked).toBe(true)
  await page.keyboard.down('KeyW')
  await page.waitForTimeout(1500)
  await page.keyboard.up('KeyW')
  await page.screenshot({ path: 'test-results/tp-sabrina-model.png' })
  await page.keyboard.press('Escape')
  await expect.poll(async () => (await snapshot(page)).status).toBe('paused')
  expect(errors).toEqual([])
})

test('third-person renders the Mosin-Nagant and Qiongjiu models', async ({ page }) => {
  const errors: string[] = []
  for (const [doll, shot] of [['Mosin-Nagant', 'tp-mosin.png'], ['Qiongjiu', 'tp-qiongjiu.png']] as const) {
    await startThirdPerson(page, doll, errors)
    await page.getByText('Click to enter third-person control').click()
    await expect.poll(async () => (await snapshot(page)).thirdperson?.locked).toBe(true)
    await page.keyboard.down('KeyW')
    await page.waitForTimeout(1500)
    await page.keyboard.up('KeyW')
    await page.screenshot({ path: `test-results/${shot}` })
    await page.keyboard.press('Escape')
    await expect.poll(async () => (await snapshot(page)).status).toBe('paused')
  }
  expect(errors).toEqual([])
})

test('third-person dash displaces and camera stays framed', async ({ page }) => {
  const errors: string[] = []
  await startThirdPerson(page, 'Sabrina', errors)
  await page.getByText('Click to enter third-person control').click()
  await expect.poll(async () => (await snapshot(page)).thirdperson?.locked).toBe(true)
  const raw = () => page.locator('canvas').getAttribute('data-playground').then((s) => JSON.parse(s!))
  // Dash north with W held: displacement must exceed a single walk step and
  // the perspective camera must stay above ground inside the arena surround.
  await page.keyboard.down('KeyW')
  await page.waitForTimeout(400)
  const pre = await raw()
  await page.keyboard.press('Space')
  await page.waitForTimeout(900)
  const post = await raw()
  await page.keyboard.up('KeyW')
  const moved = Math.hypot(post.player.x - pre.player.x, post.player.z - pre.player.z)
  expect(moved).toBeGreaterThan(1.5)
  expect(post.camera[1]).toBeGreaterThan(0.5)
  expect(Math.abs(post.camera[0])).toBeLessThan(80)
  expect(Math.abs(post.camera[2])).toBeLessThan(80)
  // Aiming resolves while locked; firing stays gated on held fire.
  expect(post.thirdperson.aimTarget).not.toBeNull()
  await page.screenshot({ path: 'test-results/tp-sabrina-dash.png' })
  await page.keyboard.press('Escape')
  await expect.poll(async () => (await snapshot(page)).status).toBe('paused')
  expect(errors).toEqual([])
})

test('third-person level-up resumes and death retries fresh', async ({ page }) => {
  test.setTimeout(180000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/?mode=thirdperson&inspect=1&devxp=150')
  await page.getByRole('button', { name: 'Select Sabrina', exact: true }).click()
  await page.getByRole('button', { name: 'Start run' }).click()
  await expect(page.locator('canvas')).toHaveAttribute('data-playground', /player/)
  // Queued levels resolve one dialog after another; drain them all.
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
  for (let i = 0; i < 12; i++) {
    const dialog = page.getByRole('dialog')
    if (!(await dialog.isVisible())) break
    await dialog.getByRole('button').first().click()
    await page.waitForTimeout(400)
  }
  await expect.poll(async () => (await snapshot(page)).status, { timeout: 15000 }).toBe('playing')
  await page.screenshot({ path: 'test-results/tp-sabrina-levelup.png' })
  // Death without firing: lock in, then stand still until contact ends the run.
  await expect(page.getByText('Click to enter third-person control')).toBeVisible()
  await page.getByText('Click to enter third-person control').click()
  await expect.poll(async () => (await snapshot(page)).thirdperson?.locked).toBe(true)
  await expect.poll(async () => (await snapshot(page)).status, { timeout: 150000 }).toBe('game_over')
  await expect(page.getByRole('dialog')).toContainText('Game over')
  await page.screenshot({ path: 'test-results/tp-sabrina-gameover.png' })
  await page.getByRole('button', { name: /retry with sabrina/i }).click()
  await expect.poll(async () => (await snapshot(page)).status, { timeout: 15000 }).toBe('playing')
  const fresh = await snapshot(page)
  expect(fresh.kills).toBe(0)
  expect(fresh.shots).toBe(0)
  expect(errors).toEqual([])
})
