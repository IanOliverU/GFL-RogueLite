import { expect, test, type Page } from '@playwright/test'

interface CameraSnapshot {
  player: { x: number; z: number }
  aimTarget: { x: number; z: number } | null
  aimDirection: { x: number; z: number }
  elapsed: number
  status: string
  held: string[]
  cameraPreset: string
  dash: { remaining: number; cooldown: number; direction: { x: number; z: number } }
  targetScreen: { x: number; y: number }
}

async function snapshot(page: Page): Promise<CameraSnapshot> {
  return JSON.parse((await page.locator('canvas').getAttribute('data-playground'))!) as CameraSnapshot
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

async function startPlayground(page: Page, query = '/?inspect=1&mode=playground') {
  await page.goto(query)
  await expect(page.locator('canvas')).toHaveAttribute('data-playground', /player/)
  if (await page.getByRole('dialog').isVisible()) await page.getByRole('button', { name: 'Resume playground' }).click()
  await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
}

test('angled is the default preset with screen-relative movement and aligned aim', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await startPlayground(page)
  expect((await snapshot(page)).cameraPreset).toBe('angled')

  // W points screen-up: at 45 degrees both world axes decrease together.
  await page.keyboard.down('KeyW')
  await expect.poll(async () => (await snapshot(page)).player.x, { timeout: 8000 }).toBeLessThan(-1)
  expect((await snapshot(page)).player.z).toBeLessThan(-1)
  await page.keyboard.up('KeyW')
  // D points screen-right: +x with matching -z.
  await page.keyboard.down('KeyD')
  await expect.poll(async () => (await snapshot(page)).player.x, { timeout: 8000 }).toBeGreaterThan(0.5)
  expect((await snapshot(page)).player.z).toBeLessThan(-2)
  await page.keyboard.up('KeyD')

  for (const [x, y] of [[450, 240], [820, 240], [450, 570], [820, 570]]) {
    await page.mouse.move(x, y)
    await expectCursorAlignment(page, x, y)
  }
  expect(errors).toEqual([])
})

test('pause menu switches presets without discarding the run', async ({ page }) => {
  await startPlayground(page)
  await page.keyboard.down('KeyW')
  await expect.poll(async () => (await snapshot(page)).player.z).toBeLessThan(-0.5)
  await page.getByRole('button', { name: 'Pause Esc' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Angled', exact: true })).toHaveAttribute('aria-pressed', 'true')
  const before = await snapshot(page)
  expect(before.cameraPreset).toBe('angled')

  await page.getByRole('button', { name: 'Classic', exact: true }).click()
  // Switching clears held input but keeps the run: same position, frozen clock.
  await expect.poll(async () => (await snapshot(page)).cameraPreset).toBe('classic')
  await expect.poll(async () => (await snapshot(page)).held).toEqual([])
  const switched = await snapshot(page)
  expect(switched.player).toEqual(before.player)
  await page.waitForTimeout(250)
  expect((await snapshot(page)).elapsed).toBe(switched.elapsed)
  await page.keyboard.up('KeyW')

  await page.getByRole('button', { name: 'Resume playground' }).click()
  await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
  // Classic mapping restored: W walks straight north with no eastward drift.
  const resume = await snapshot(page)
  await page.keyboard.down('KeyW')
  await expect.poll(async () => (await snapshot(page)).player.z).toBeLessThan(resume.player.z - 1)
  const after = await snapshot(page)
  expect(after.player.x).toBeCloseTo(resume.player.x, 6)
  expect(after.cameraPreset).toBe('classic')
  await page.keyboard.up('KeyW')

  // Back to Angled the same way, still the same run.
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Angled', exact: true }).click()
  await expect.poll(async () => (await snapshot(page)).cameraPreset).toBe('angled')
  await page.getByRole('button', { name: 'Resume playground' }).click()
  await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
})

test('dash follows the rotated movement vector', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/?inspect=1')
  await page.getByRole('button', { name: 'Select Sabrina', exact: true }).click()
  await page.getByRole('button', { name: 'Start run' }).click()
  await expect(page.locator('canvas')).toHaveAttribute('data-playground', /player/)
  await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
  expect((await snapshot(page)).cameraPreset).toBe('angled')

  await page.keyboard.down('KeyD')
  await page.keyboard.press('Space')
  await expect.poll(async () => (await snapshot(page)).dash.direction.x).toBeGreaterThan(0.7)
  const dash = await snapshot(page)
  expect(dash.dash.direction.x).toBeCloseTo(Math.SQRT1_2, 5)
  expect(dash.dash.direction.z).toBeCloseTo(-Math.SQRT1_2, 5)
  await page.keyboard.up('KeyD')
  expect(errors).toEqual([])
})

test('angled stays usable at narrow widths and honors the camera query override', async ({ page }) => {
  await startPlayground(page, '/?inspect=1&mode=playground&camera=classic')
  expect((await snapshot(page)).cameraPreset).toBe('classic')
  await page.setViewportSize({ width: 900, height: 700 })
  await page.getByRole('button', { name: 'Pause Esc' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Angled', exact: true }).click()
  await expect.poll(async () => (await snapshot(page)).cameraPreset).toBe('angled')
  await page.getByRole('button', { name: 'Resume playground' }).click()
  await expect.poll(async () => (await snapshot(page)).status).toBe('playing')
  await page.mouse.move(640, 350)
  await expectCursorAlignment(page, 640, 350)
})
