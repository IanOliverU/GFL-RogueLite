import { describe, expect, it } from 'vitest'
import { CAMERA_PRESETS, getCameraPreset, resetCameraPreset, screenBasis, setCameraPreset } from '../../src/game/data/camera'
import { createWorld } from '../../src/game/core/world'
import { movePlayer } from '../../src/game/systems/movement'
import { stepDash } from '../../src/game/systems/dash'

const YAW = Math.PI / 4
const DIAGONAL = Math.SQRT1_2

describe('camera presets', () => {
  it('keeps Classic identical to the historical framing', () => {
    expect(CAMERA_PRESETS.classic.yaw).toBe(0)
    expect(CAMERA_PRESETS.classic.halfHeight).toBe(14)
    expect(CAMERA_PRESETS.classic.follow).toBe(0.45)
    expect(Math.tan(CAMERA_PRESETS.classic.elevation)).toBeCloseTo(22 / 18, 12)
    expect(CAMERA_PRESETS.classic.distance).toBeCloseTo(Math.hypot(22, 18), 12)
  })
  it('defaults to Angled and switches reversibly', () => {
    resetCameraPreset()
    expect(getCameraPreset().id).toBe('angled')
    setCameraPreset('classic')
    expect(getCameraPreset().id).toBe('classic')
    setCameraPreset('angled')
    expect(getCameraPreset().id).toBe('angled')
    resetCameraPreset()
  })
  it('maps screen axes to world axes at yaw 0', () => {
    const basis = screenBasis(0)
    expect(basis.up).toEqual({ x: -0, z: -1 })
    expect(basis.right).toEqual({ x: 1, z: -0 })
  })
  it('maps W toward screen-up and D toward screen-right at 45 degrees', () => {
    const basis = screenBasis(YAW)
    expect(basis.up.x).toBeCloseTo(-DIAGONAL, 12)
    expect(basis.up.z).toBeCloseTo(-DIAGONAL, 12)
    expect(basis.right.x).toBeCloseTo(DIAGONAL, 12)
    expect(basis.right.z).toBeCloseTo(-DIAGONAL, 12)
  })
})

describe('screen-relative movement', () => {
  it('reproduces the original mapping at yaw 0', () => {
    const player = { x: 0, z: 0 }
    movePlayer(player, new Set(['KeyW']), 1, [], 0)
    expect(player.x).toBeCloseTo(0, 12)
    expect(player.z).toBeCloseTo(-6, 12)
  })
  it('moves W toward screen-up and D toward screen-right at 45 degrees', () => {
    const north = { x: 0, z: 0 }
    movePlayer(north, new Set(['KeyW']), 1, [], YAW)
    expect(north.x).toBeCloseTo(-6 * DIAGONAL, 10)
    expect(north.z).toBeCloseTo(-6 * DIAGONAL, 10)
    const east = { x: 0, z: 0 }
    movePlayer(east, new Set(['KeyD']), 1, [], YAW)
    expect(east.x).toBeCloseTo(6 * DIAGONAL, 10)
    expect(east.z).toBeCloseTo(-6 * DIAGONAL, 10)
  })
  it('keeps diagonal speed normalized under rotation', () => {
    const straight = { x: 0, z: 0 }
    const diagonal = { x: 0, z: 0 }
    for (let i = 0; i < 60; i++) {
      movePlayer(straight, new Set(['KeyW']), 1 / 60, [], YAW)
      movePlayer(diagonal, new Set(['KeyW', 'KeyD']), 1 / 60, [], YAW)
    }
    expect(Math.hypot(diagonal.x, diagonal.z)).toBeCloseTo(Math.hypot(straight.x, straight.z), 10)
  })
  it('cancels opposite inputs under rotation', () => {
    const player = { x: 2, z: 3 }
    movePlayer(player, new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD']), 1, [], YAW)
    expect(player).toEqual({ x: 2, z: 3 })
  })
})

describe('screen-relative dash', () => {
  it('dashes along the rotated movement vector', () => {
    const world = createWorld('sabrina', true)
    world.aimDirection = { x: 0, z: 1 }
    stepDash(world, new Set(['KeyD']), true, 1 / 60, YAW)
    expect(world.dash.direction.x).toBeCloseTo(DIAGONAL, 10)
    expect(world.dash.direction.z).toBeCloseTo(-DIAGONAL, 10)
  })
  it('falls back to aim direction with no movement keys in any preset', () => {
    const world = createWorld('sabrina', true)
    world.aimDirection = { x: 0, z: 1 }
    stepDash(world, new Set(), true, 1 / 60, YAW)
    expect(world.dash.direction).toEqual({ x: 0, z: 1 })
  })
})
