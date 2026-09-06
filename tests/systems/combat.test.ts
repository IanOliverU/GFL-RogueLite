import { describe, expect, it } from 'vitest'
import { Simulation, FIXED_STEP } from '../../src/game/core/Simulation'
import { createEnemy, createWorld } from '../../src/game/core/world'
import { CHARACTERS, CHARACTER_LIST } from '../../src/game/data/characters'
import { WEAPONS } from '../../src/game/data/weapons'
import { COMBAT_OBSTACLES, MAX_ENEMIES, MAX_PROJECTILES } from '../../src/game/data/arena'
import { stepWeapon } from '../../src/game/systems/weapons'
import { stepProjectiles } from '../../src/game/systems/projectiles'
import { stepEnemies } from '../../src/game/systems/enemies'
import { segmentCircle, segmentBox, moveCircle } from '../../src/game/systems/collision'

describe.each(CHARACTER_LIST)('$name combat lifecycle', (doll) => {
  it('fires, damages, defeats, dies, freezes and retries with pristine state', () => {
    const simulation = new Simulation('combat')
    simulation.startRun(doll.id)
    simulation.pointer = { x: 500, y: 250 }
    for (let frame = 0; frame < 600 && !simulation.world.kills; frame++) simulation.advance(FIXED_STEP, () => ({ x: 0, z: -4 }))
    expect(simulation.world.shots).toBeGreaterThan(0)
    expect(simulation.world.damageDealt).toBeGreaterThan(0)
    expect(simulation.world.kills).toBeGreaterThan(0)
    simulation.pointer = null
    for (let frame = 0; frame < 2400 && simulation.getStatus() !== 'game_over'; frame++) simulation.advance(FIXED_STEP)
    expect(simulation.getStatus()).toBe('game_over')
    expect(simulation.world.health).toBe(0)
    const dead = structuredClone(simulation.world)
    simulation.resume()
    simulation.pause('focus')
    simulation.advance(10)
    expect(simulation.world).toEqual(dead)
    expect(simulation.getStatus()).toBe('game_over')
    simulation.startRun(doll.id)
    expect(simulation.world).toEqual(createWorld(doll.id, true))
    expect(simulation.pointer).toBeNull()
    expect(simulation.held.size).toBe(0)
    simulation.returnToSelection()
    const selection = structuredClone(simulation.world)
    simulation.advance(10)
    simulation.resume()
    expect(simulation.getStatus()).toBe('selection')
    expect(simulation.world).toEqual(selection)
    simulation.startRun(doll.id === 'sabrina' ? 'peritya' : 'sabrina')
    expect(simulation.world).toEqual(createWorld(doll.id === 'sabrina' ? 'peritya' : 'sabrina', true))
  })

  it('consumes one magazine unit per discharge, reloads exactly, and preserves timers while paused', () => {
    const world = createWorld(doll.id, true)
    const definition = WEAPONS[doll.weaponId]
    let ticks = 0
    while (!world.reloads && ticks++ < 2000) {
      stepWeapon(world, FIXED_STEP, true)
      world.projectiles = []
    }
    expect(world.shots).toBe(definition.magazine)
    expect(world.weapon.ammo).toBe(0)
    const simulation = new Simulation()
    simulation.world = world
    simulation.pause('focus')
    const paused = structuredClone(world)
    simulation.advance(20)
    expect(world).toEqual(paused)
    // Finish reload without an aim gate so it cannot immediately spend the new round.
    for (let i = 0; i < Math.round(definition.reload / FIXED_STEP) - 1; i++) stepWeapon(world, FIXED_STEP, false)
    expect(world.weapon.ammo).toBe(0)
    stepWeapon(world, FIXED_STEP, false)
    expect(world.weapon.ammo).toBe(definition.magazine)
    expect(world.weapon.reloadRemaining).toBe(0)
    expect(world.shots).toBe(definition.magazine)
  })
})

describe('shared weapon rules', () => {
  it('uses the current post-movement aim for the first fired round', () => {
    const simulation = new Simulation()
    simulation.startRun('qiongjiu')
    simulation.pointer = { x: 500, y: 200 }
    simulation.held.add('KeyD')
    simulation.advance(FIXED_STEP, (player) => ({ x: player.x + 4, z: player.z }))
    expect(simulation.world.player.x).toBeCloseTo(0.1)
    expect(simulation.world.projectiles[0].direction).toEqual({ x: 1, z: 0 })
    expect(simulation.world.projectiles[0].x).toBeCloseTo(0.1 + 40 / 60)
  })
  it('freezes a mid-burst pause and resumes without queued fire before fresh aim input', () => {
    const simulation = new Simulation()
    simulation.startRun('qiongjiu')
    simulation.pointer = { x: 1, y: 1 }
    simulation.advance(FIXED_STEP)
    expect(simulation.world.weapon.burstRemaining).toBe(2)
    simulation.pause('focus')
    const paused = structuredClone(simulation.world)
    simulation.advance(300)
    expect(simulation.world).toEqual(paused)
    simulation.resume()
    simulation.advance(FIXED_STEP)
    expect(simulation.world.shots).toBe(1)
    expect(simulation.world.weapon.burstRemaining).toBe(0)
  })
  it('emits three Qiongjiu rounds 0.1 seconds apart, then a 0.55-second recovery', () => {
    const world = createWorld('qiongjiu', true)
    const times: number[] = []
    for (let tick = 0; tick < 80; tick++) {
      const before = world.shots
      stepWeapon(world, FIXED_STEP, true)
      if (world.shots !== before) times.push((tick + 1) * FIXED_STEP)
    }
    for (const [index, expected] of [1 / 60, 7 / 60, 13 / 60, 46 / 60].entries()) expect(times[index]).toBeCloseTo(expected, 10)
  })
  it('range-gates every burst round, cancels pending bursts, never redirects cursor aim', () => {
    const world = createWorld('qiongjiu', true)
    world.aimDirection = { x: 1, z: 0 }
    stepWeapon(world, FIXED_STEP, true)
    expect(world.projectiles[0].direction).toEqual({ x: 1, z: 0 })
    world.enemies = []
    for (let i = 0; i < 60; i++) stepWeapon(world, FIXED_STEP, true)
    expect(world.shots).toBe(1)
    expect(world.weapon.burstRemaining).toBe(0)
    world.enemies = [createEnemy(10, 0, -4)]
    stepWeapon(world, FIXED_STEP, false)
    expect(world.shots).toBe(1)
    stepWeapon(world, FIXED_STEP, true)
    expect(world.shots).toBe(2)
  })
  it('gives Sabrina a broader, heavier volley and Vepley a faster lighter one', () => {
    const sabrina = createWorld('sabrina', true), vepley = createWorld('vepley', true)
    stepWeapon(sabrina, FIXED_STEP, true)
    stepWeapon(vepley, FIXED_STEP, true)
    expect(sabrina.projectiles).toHaveLength(7)
    expect(vepley.projectiles).toHaveLength(5)
    expect(Math.abs(sabrina.projectiles[0].direction.x)).toBeGreaterThan(Math.abs(vepley.projectiles[0].direction.x))
    expect(sabrina.projectiles[0].damage).toBeGreaterThan(vepley.projectiles[0].damage)
    expect(sabrina.weapon.cooldown).toBeGreaterThan(vepley.weapon.cooldown)
  })
  it('has equal firing counts at 30/60/144 render Hz for every doll', () => {
    for (const doll of CHARACTER_LIST) {
      const counts = [30, 60, 144].map((fps) => {
        const simulation = new Simulation()
        simulation.startRun(doll.id)
        simulation.pointer = { x: 10, y: 10 }
        for (let i = 0; i < fps * 2; i++) simulation.advance(1 / fps, () => ({ x: 20, z: 0 }))
        return simulation.world.shots
      })
      expect(new Set(counts).size).toBe(1)
    }
  })
  it('caps projectiles instead of allocating unbounded shots', () => {
    const world = createWorld('peritya', true)
    for (let tick = 0; tick < 10000; tick++) stepWeapon(world, FIXED_STEP, true)
    expect(world.projectiles.length).toBe(MAX_PROJECTILES)
  })
})

describe('swept collision and knockback', () => {
  it('detects thin targets between endpoints, tangents and starting overlaps', () => {
    expect(segmentCircle({ x: -10, z: 0 }, { x: 10, z: 0 }, { x: 0, z: 0 }, 0.1)).toBeCloseTo(0.495)
    expect(segmentCircle({ x: -1, z: 1 }, { x: 1, z: 1 }, { x: 0, z: 0 }, 1)).toBe(0.5)
    expect(segmentCircle({ x: 0, z: 0 }, { x: 0, z: 0 }, { x: 0, z: 0 }, 1)).toBe(0)
    expect(segmentBox({ x: 0, z: 0 }, { x: 10, z: 0 }, COMBAT_OBSTACLES[0])).toBe(0.35)
  })
  it('sniper pierces at most three enemies in distance order regardless of collection order', () => {
    const world = createWorld('mosin-nagant', true)
    world.enemies = [createEnemy(20, 0, -4), createEnemy(21, 0, -2), createEnemy(22, 0, -6), createEnemy(23, 0, -8)]
    stepWeapon(world, FIXED_STEP, true)
    stepProjectiles(world, 0.2)
    expect(world.kills).toBe(3)
    expect(world.enemies.map((enemy) => enemy.id)).toEqual([23])
    expect(world.projectiles).toHaveLength(0)
  })
  it('does not repeatedly hit the same enemy during overlap', () => {
    const world = createWorld('mosin-nagant', true)
    world.enemies = [createEnemy(20, 0, -0.2)]
    world.enemies[0].health = 1000
    stepWeapon(world, FIXED_STEP, true)
    for (let i = 0; i < 5; i++) stepProjectiles(world, 0.001)
    expect(world.hits).toBe(1)
    expect(world.enemies[0].health).toBe(930)
  })
  it('stops piercing at cover, damages only the enemy in front, and removes perimeter hits', () => {
    const world = createWorld('mosin-nagant', true)
    world.aimDirection = { x: 1, z: 0 }
    world.enemies = [createEnemy(20, 2, 0), createEnemy(21, 6, 0)]
    stepWeapon(world, FIXED_STEP, true)
    stepProjectiles(world, 0.2)
    expect(world.kills).toBe(1)
    expect(world.enemies[0].health).toBe(40)
    expect(world.projectiles).toHaveLength(0)
    world.aimDirection = { x: 0, z: 1 }
    world.weapon.cooldown = 0
    stepWeapon(world, FIXED_STEP, true)
    stepProjectiles(world, 0.5)
    expect(world.projectiles).toHaveLength(0)
  })
  it('applies stronger but bounded Vepley impulse and cannot push through cover', () => {
    const impulses = ['sabrina', 'vepley'].map((id) => {
      const world = createWorld(id as 'sabrina' | 'vepley', true)
      world.enemies = [createEnemy(20, 0, -1)]
      world.enemies[0].health = 10000
      stepWeapon(world, FIXED_STEP, true)
      stepProjectiles(world, 0.1)
      return Math.hypot(world.enemies[0].knockback.x, world.enemies[0].knockback.z)
    })
    expect(impulses[1]).toBeGreaterThan(impulses[0] * 4)
    expect(impulses[1]).toBeCloseTo(12)
    const enemy = { x: 3, z: 0 }
    moveCircle(enemy, 20, 0, 0.45, COMBAT_OBSTACLES)
    expect(enemy.x).toBeCloseTo(3.05)
  })
  it('pursuers navigate around cover and spawns stay bounded', () => {
    const world = createWorld('sabrina', true)
    world.player = { x: 6, z: 0 }
    world.enemies = [createEnemy(20, 2, 0)]
    for (let i = 0; i < 600; i++) stepEnemies(world, FIXED_STEP)
    expect(world.enemies.find((enemy) => enemy.id === 20)!.x).toBeGreaterThan(4.3)
    expect(world.health).toBeLessThan(CHARACTERS.sabrina.maxHealth)
    expect(world.enemies.length).toBeLessThanOrEqual(MAX_ENEMIES)
  })
})
