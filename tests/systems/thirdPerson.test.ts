import { describe, expect, it } from 'vitest'
import { MAP_HALF_DEPTH, MAP_HALF_WIDTH, createWorld } from '../../src/game/core/world'
import { Simulation } from '../../src/game/core/Simulation'
import { parseStage, THIRDPERSON_HEIGHTS, THIRDPERSON_OBSTACLES } from '../../src/game/data/arena'
import { screenBasis } from '../../src/game/data/camera'
import { MIN_SPAWN_DISTANCE } from '../../src/game/data/pressure'
import {
  clampPitch, collideCamera, followFactor, orbitForward, orbitOffset, THIRD_PERSON,
} from '../../src/game/data/thirdPerson'
import { resolveThirdPersonTarget } from '../../src/game/systems/thirdPersonAim'

describe('third-person orbit math', () => {
  it('clamps pitch to a useful non-inverted range', () => {
    expect(clampPitch(-1)).toBe((THIRD_PERSON.minPitchDegrees * Math.PI) / 180)
    expect(clampPitch(10)).toBe((THIRD_PERSON.maxPitchDegrees * Math.PI) / 180)
    const mid = (THIRD_PERSON.startPitchDegrees * Math.PI) / 180
    expect(clampPitch(mid)).toBe(mid)
  })

  it('places the camera behind and above the target', () => {
    expect(orbitOffset(0, 0, 6)).toEqual({ x: 0, y: 0, z: 6 })
    const up = orbitOffset(0, Math.PI / 2, 6)
    expect(up.x).toBeCloseTo(0, 6)
    expect(up.y).toBeCloseTo(6, 6)
    expect(up.z).toBeCloseTo(0, 6)
  })

  it('faces along the shared screen-relative basis', () => {
    for (const yaw of [0, Math.PI / 4, Math.PI / 2, Math.PI, -Math.PI / 3]) {
      const forward = orbitForward(yaw)
      const basis = screenBasis(yaw)
      expect(forward.x).toBeCloseTo(basis.up.x, 10)
      expect(forward.z).toBeCloseTo(basis.up.z, 10)
      expect(Math.hypot(forward.x, forward.z)).toBeCloseTo(1, 10)
    }
  })

  it('smooths follow frame-rate independently', () => {
    expect(followFactor(0)).toBe(1)
    expect(followFactor(-1)).toBe(1)
    const a = followFactor(1 / 60)
    expect(a).toBeGreaterThan(0)
    expect(a).toBeLessThan(1)
    expect(followFactor(1 / 30)).toBeGreaterThan(a)
  })
})

describe('third-person camera collision', () => {
  const target = { x: 0, y: 1.6, z: 0 }
  const desired = { x: 0, y: 2.5, z: 8 }
  const wall = [{ id: 'w', minX: -5, maxX: 5, minZ: 3, maxZ: 4 }]

  it('leaves open sight lines alone', () => {
    expect(collideCamera(target, desired, [], {})).toEqual(desired)
    expect(collideCamera(target, desired, wall, { w: 0.5 })).toEqual(desired)
  })

  it('pulls the camera before tall cover it would clip through', () => {
    const pulled = collideCamera(target, desired, wall, { w: 3 })
    expect(pulled.z).toBeLessThan(2.7)
    expect(pulled.z).toBeGreaterThan(2.4)
    expect(pulled.y).toBeLessThan(2.0)
  })

  it('recovers the desired position once the obstruction clears', () => {
    const pulled = collideCamera(target, desired, wall, { w: 3 })
    expect(collideCamera(target, desired, [], {})).toEqual(desired)
    expect(pulled).not.toEqual(desired)
  })
})

describe('third-person muzzle-path resolution', () => {
  it('passes clear sight lines through unchanged', () => {
    const world = createWorld('sabrina', true, 'thirdperson')
    world.player = { x: 0, z: 0 }
    expect(resolveThirdPersonTarget(world, { x: 0, z: -10 })).toEqual({ x: 0, z: -10 })
  })

  it('clamps targets behind cover to the blocking surface', () => {
    const world = createWorld('sabrina', true, 'thirdperson')
    world.player = { x: 0, z: 0 }
    // North wall face sits at z = -14.8; the crosshair may see beyond it.
    const resolved = resolveThirdPersonTarget(world, { x: 0, z: -20 })!
    expect(resolved.z).toBeGreaterThan(-15)
    expect(resolved.z).toBeLessThan(-14.5)
    expect(resolved.x).toBeCloseTo(0, 6)
  })

  it('clamps out-of-bounds targets to the map edge', () => {
    const world = createWorld('sabrina', false)
    world.player = { x: 0, z: 0 }
    expect(resolveThirdPersonTarget(world, { x: 200, z: 0 })).toEqual({ x: MAP_HALF_WIDTH, z: 0 })
  })

  it('rejects missing or invalid targets without touching aim', () => {
    const world = createWorld('sabrina', true, 'thirdperson')
    expect(resolveThirdPersonTarget(world, null)).toBeNull()
    expect(resolveThirdPersonTarget(world, { x: NaN, z: 0 })).toBeNull()
  })
})

describe('third-person test arena layout', () => {
  it('defines its own seven footprints without touching other stages', () => {
    expect(THIRDPERSON_OBSTACLES).toHaveLength(7)
    expect(new Set(THIRDPERSON_OBSTACLES.map((o) => o.id)).size).toBe(7)
    for (const o of THIRDPERSON_OBSTACLES) {
      expect(o.minX).toBeGreaterThanOrEqual(-MAP_HALF_WIDTH)
      expect(o.maxX).toBeLessThanOrEqual(MAP_HALF_WIDTH)
      expect(o.minZ).toBeGreaterThanOrEqual(-MAP_HALF_DEPTH)
      expect(o.maxZ).toBeLessThanOrEqual(MAP_HALF_DEPTH)
      expect(THIRDPERSON_HEIGHTS[o.id]).toBeGreaterThan(0)
    }
    for (let i = 0; i < THIRDPERSON_OBSTACLES.length; i++) {
      for (let j = i + 1; j < THIRDPERSON_OBSTACLES.length; j++) {
        const a = THIRDPERSON_OBSTACLES[i], b = THIRDPERSON_OBSTACLES[j]
        const overlap = a.minX < b.maxX && b.minX < a.maxX && a.minZ < b.maxZ && b.minZ < a.maxZ
        expect(overlap, `${a.id} vs ${b.id}`).toBe(false)
      }
    }
  })

  it('keeps spawn, player start, and covers mutually clear', () => {
    const world = createWorld('sabrina', true, 'thirdperson')
    expect(world.spawnPoints.length).toBeGreaterThanOrEqual(8)
    for (const spawn of world.spawnPoints) {
      expect(Math.abs(spawn.x)).toBeLessThanOrEqual(17.5)
      expect(Math.abs(spawn.z)).toBeLessThanOrEqual(14.3)
      expect(Math.hypot(spawn.x, spawn.z)).toBeGreaterThanOrEqual(MIN_SPAWN_DISTANCE)
      for (const o of world.obstacles) {
        const inside = spawn.x > o.minX - 1 && spawn.x < o.maxX + 1 && spawn.z > o.minZ - 1 && spawn.z < o.maxZ + 1
        expect(inside, `spawn ${spawn.x},${spawn.z} in ${o.id}`).toBe(false)
      }
    }
    for (const point of [{ x: 0, z: 0 }, { x: 0, z: -4 }]) {
      for (const o of world.obstacles) {
        const inside = point.x > o.minX - 0.45 && point.x < o.maxX + 0.45 && point.z > o.minZ - 0.45 && point.z < o.maxZ + 0.45
        expect(inside, `start in ${o.id}`).toBe(false)
      }
    }
  })

  it('parses the experimental stage id', () => {
    expect(parseStage('thirdperson')).toBe('thirdperson')
    expect(parseStage('urban')).toBe('district')
    expect(parseStage(null)).toBe('district')
  })
})

describe('third-person simulation wiring', () => {
  it('enters selection with shared combat systems and manual fire', () => {
    const simulation = new Simulation('thirdperson', 'thirdperson')
    expect(simulation.thirdPerson).toBe(true)
    expect(simulation.getStatus()).toBe('selection')
    expect(simulation.fireHeld).toBe(false)
    simulation.startRun('sabrina')
    expect(simulation.world.combat).toBe(true)
    expect(simulation.world.obstacles).toHaveLength(7)
    // Enemy in range but no deliberate fire: the gate stays closed.
    simulation.advance(1 / 60)
    expect(simulation.world.shots).toBe(0)
    // Held fire with the crosshair sampled: shared weapon system discharges.
    simulation.fireHeld = true
    simulation.advance(1 / 60, () => ({ x: 0, z: -4 }))
    expect(simulation.world.shots).toBeGreaterThan(0)
    // Pause/focus clearing drops held fire: no queued shots afterward.
    simulation.clearInput()
    expect(simulation.fireHeld).toBe(false)
  })

  it('leaves legacy modes on automatic range-gated fire', () => {
    const simulation = new Simulation('combat')
    expect(simulation.thirdPerson).toBe(false)
    simulation.startRun('sabrina')
    simulation.pointer = { x: 1, y: 1 }
    simulation.advance(1 / 60, () => ({ x: 0, z: -4 }))
    expect(simulation.world.shots).toBeGreaterThan(0)
  })
})
