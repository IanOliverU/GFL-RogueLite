import { describe, expect, it } from 'vitest'
import { FIXED_STEP, Simulation } from '../../src/game/core/Simulation'
import { ARENA_HALF_SIZE, createEnemy, createWorld, PLAYER_RADIUS } from '../../src/game/core/world'
import { CHARACTER_LIST } from '../../src/game/data/characters'
import { COMBAT_OBSTACLES, PURSUER, RANGED } from '../../src/game/data/arena'
import { DASH } from '../../src/game/data/dash'
import { FAR_SPAWN_DISTANCE, MIN_SPAWN_DISTANCE, PRESSURE_PHASES, pressureAt } from '../../src/game/data/pressure'
import { stepEnemies } from '../../src/game/systems/enemies'
import { moveCircleSwept } from '../../src/game/systems/collision'
import { damagePlayer } from '../../src/game/systems/damage'
import { separateEnemies } from '../../src/game/systems/enemySeparation'
import { stepEnemyProjectiles } from '../../src/game/systems/enemyProjectiles'
import { stepRangedAttacks, warningPath } from '../../src/game/systems/rangedAttacks'
import { stepSpawning } from '../../src/game/systems/spawning'

const DASH_DISTANCE = DASH.speed * DASH.duration
const runSteps = (simulation: Simulation, steps: number, aim?: (player: { x: number; z: number }) => { x: number; z: number }) => {
  for (let i = 0; i < steps; i++) simulation.advance(FIXED_STEP, aim)
}

describe('dash', () => {
  it('dashes along held movement direction, falling back to aim when stationary', () => {
    const moving = new Simulation('combat')
    moving.startRun('sabrina')
    moving.held.add('KeyW') // Movement north; aim points east and must lose.
    moving.pointer = { x: 0, y: 0 }
    expect(moving.requestDash()).toBe(true)
    runSteps(moving, 12, () => ({ x: 20, z: 0 }))
    expect(moving.world.player.z).toBeCloseTo(-DASH_DISTANCE, 6)
    expect(moving.world.player.x).toBeCloseTo(0, 6)
    expect(moving.world.dashes).toBe(1)

    const stationary = new Simulation('combat')
    stationary.startRun('sabrina')
    stationary.pointer = { x: 0, y: 0 }
    stationary.requestDash()
    runSteps(stationary, 12, () => ({ x: 0, z: 20 }))
    expect(stationary.world.player.z).toBeCloseTo(DASH_DISTANCE, 6)
  })

  it('covers the same dash distance at 30, 60 and 144 render Hz', () => {
    for (const fps of [30, 60, 144]) {
      const simulation = new Simulation('combat')
      simulation.startRun('tololo')
      simulation.pointer = { x: 0, y: 0 }
      simulation.requestDash()
      for (let i = 0; i < Math.ceil(0.25 * fps); i++) simulation.advance(1 / fps, () => ({ x: 0, z: 20 }))
      expect(simulation.world.player.z).toBeCloseTo(DASH_DISTANCE, 5)
    }
  })

  it('enforces the cooldown measured from activation', () => {
    const simulation = new Simulation('combat')
    simulation.startRun('sabrina')
    simulation.pointer = { x: 0, y: 0 }
    expect(simulation.requestDash()).toBe(true)
    runSteps(simulation, 30, () => ({ x: 0, z: 20 }))
    expect(simulation.requestDash()).toBe(false)
    expect(simulation.world.dashes).toBe(1)
    // 30 steps include the activation step, so only 29 cooldown decrements ran.
    expect(simulation.world.dash.cooldown).toBeCloseTo(DASH.cooldown - (29 * FIXED_STEP), 8)
    runSteps(simulation, 43, () => ({ x: 0, z: 20 }))
    expect(simulation.world.dash.cooldown).toBeCloseTo(0, 8)
    expect(simulation.requestDash()).toBe(true)
    runSteps(simulation, 1, () => ({ x: 0, z: 20 })) // Consume the pending request.
    expect(simulation.world.dashes).toBe(2)
  })

  it('stops at cover and the perimeter without crossing either', () => {
    const cover = new Simulation('combat')
    cover.startRun('sabrina')
    cover.world.player = { x: 2, z: 0 }
    cover.pointer = { x: 0, y: 0 }
    cover.requestDash()
    runSteps(cover, 12, () => ({ x: 20, z: 0 }))
    expect(cover.world.player.x).toBeCloseTo(COMBAT_OBSTACLES[0].minX - PLAYER_RADIUS, 6)

    const perimeter = new Simulation('combat')
    perimeter.startRun('sabrina')
    perimeter.world.player = { x: ARENA_HALF_SIZE - PLAYER_RADIUS - 1, z: 0 }
    perimeter.pointer = { x: 0, y: 0 }
    perimeter.requestDash()
    runSteps(perimeter, 12, () => ({ x: 100, z: 0 }))
    expect(perimeter.world.player.x).toBeCloseTo(ARENA_HALF_SIZE - PLAYER_RADIUS, 6)
  })

  it('permits sliding away from a touched face but never entering it', () => {
    const away = { x: COMBAT_OBSTACLES[0].minX - PLAYER_RADIUS, z: 0 }
    moveCircleSwept(away, -0.5, 0, PLAYER_RADIUS, COMBAT_OBSTACLES)
    expect(away.x).toBeCloseTo(COMBAT_OBSTACLES[0].minX - PLAYER_RADIUS - 0.5, 6)
    const blocked = { x: COMBAT_OBSTACLES[0].minX - PLAYER_RADIUS, z: 0 }
    moveCircleSwept(blocked, 0.5, 0, PLAYER_RADIUS, COMBAT_OBSTACLES)
    expect(blocked.x).toBeCloseTo(COMBAT_OBSTACLES[0].minX - PLAYER_RADIUS, 6)
  })

  it('grants invulnerability against contact only during the dash', () => {
    const simulation = new Simulation('combat')
    simulation.startRun('sabrina')
    simulation.world.enemies = [createEnemy(20, -2, 0)]
    simulation.held.add('KeyA')
    simulation.requestDash()
    runSteps(simulation, 12)
    expect(simulation.world.health).toBe(100)
    expect(simulation.world.hurtRemaining).toBe(0)
    simulation.held.delete('KeyA') // Stop on the far side and let the pursuer catch up.
    for (let i = 0; i < 150 && simulation.world.health === 100; i++) simulation.advance(FIXED_STEP)
    expect(simulation.world.health).toBe(90)
    expect(simulation.world.hurtRemaining).toBeGreaterThan(0)
  })

  it('dodges an enemy projectile during the dash and takes its damage otherwise', () => {
    const dodge = new Simulation('combat')
    dodge.startRun('sabrina')
    dodge.world.hostileProjectiles = [{ id: 99, x: -3, z: 0, direction: { x: 1, z: 0 }, remaining: 10 }]
    dodge.held.add('KeyA') // Dash west through the incoming shot.
    dodge.requestDash()
    runSteps(dodge, 12)
    expect(dodge.world.health).toBe(100)
    expect(dodge.world.dodgedShots).toBe(1)
    expect(dodge.world.hostileProjectiles).toHaveLength(0)

    const hit = new Simulation('combat')
    hit.startRun('sabrina')
    hit.world.hostileProjectiles = [{ id: 99, x: -3, z: 0, direction: { x: 1, z: 0 }, remaining: 10 }]
    for (let i = 0; i < 80 && hit.world.health === 100; i++) hit.advance(FIXED_STEP)
    expect(hit.world.health).toBe(100 - RANGED.damage)
    expect(hit.world.dodgedShots).toBe(0)
  })

  it('ignores dash requests outside active play', () => {
    const selection = new Simulation('combat')
    expect(selection.requestDash()).toBe(false)
    selection.startRun('sabrina')
    selection.pause('focus')
    expect(selection.requestDash()).toBe(false)
    selection.resume()
    expect(selection.requestDash()).toBe(true)
    selection.pause()
    selection.advance(FIXED_STEP)
    expect(selection.world.dash.remaining).toBe(0)

    const playground = new Simulation('playground')
    expect(playground.requestDash()).toBe(false)
    playground.held.add('KeyD')
    playground.advance(FIXED_STEP)
    expect(playground.world.dashes).toBe(0)
    expect(playground.world.player.x).toBeCloseTo(0.1, 10)
  })

  it('freezes dash state while paused and resumes without catch-up', () => {
    const simulation = new Simulation('combat')
    simulation.startRun('sabrina')
    simulation.pointer = { x: 0, y: 0 }
    simulation.requestDash()
    simulation.advance(FIXED_STEP, () => ({ x: 0, z: -20 }))
    expect(simulation.world.dash.remaining).toBeGreaterThan(0)
    simulation.pause('focus')
    const frozen = structuredClone(simulation.world)
    simulation.advance(10)
    expect(simulation.world).toEqual(frozen)
    simulation.resume()
    const elapsed = simulation.world.elapsed
    simulation.advance(5, () => ({ x: 0, z: -20 }))
    expect(simulation.world.elapsed - elapsed).toBeCloseTo(FIXED_STEP, 10)
  })

  it('resets dash and pressure state on retry with another doll', () => {
    const simulation = new Simulation('combat')
    simulation.startRun('sabrina')
    simulation.pointer = { x: 0, y: 0 }
    simulation.requestDash()
    simulation.advance(FIXED_STEP, () => ({ x: 0, z: -20 }))
    simulation.world.hostileProjectiles.push({ id: 50, x: 0, z: -8, direction: { x: 0, z: 1 }, remaining: 10 })
    simulation.startRun('vepley')
    expect(simulation.world).toEqual(createWorld('vepley', true))
    expect(simulation.world.dash.cooldown).toBe(0)
    expect(simulation.world.dash.remaining).toBe(0)
    expect(simulation.world.hostileProjectiles).toHaveLength(0)
    expect(simulation.world.dashes).toBe(0)
  })
})

describe.each(CHARACTER_LIST)('$name dash compatibility', (doll) => {
  it('dashes four units regardless of weapon', () => {
    const simulation = new Simulation('combat')
    simulation.startRun(doll.id)
    simulation.pointer = { x: 0, y: 0 }
    simulation.requestDash()
    runSteps(simulation, 12, () => ({ x: 0, z: -20 }))
    expect(simulation.world.player.z).toBeCloseTo(-DASH_DISTANCE, 5)
    expect(simulation.world.dashes).toBe(1)
  })
})

describe('ranged enemy', () => {
  it('warns for 0.9 seconds, then fires toward the target locked at warning onset', () => {
    const world = createWorld('sabrina', true)
    world.enemies = [createEnemy(20, 0, -6, 'ranged')]
    world.enemies[0].attackCooldown = 0
    stepRangedAttacks(world, FIXED_STEP)
    expect(world.enemies[0].attack).toEqual({ remaining: RANGED.warning, target: { x: 0, z: 0 } })
    world.player = { x: 5, z: 0 } // Relocate during the warning; the shot must not chase.
    for (let i = 0; i < Math.round(RANGED.warning / FIXED_STEP) - 1; i++) stepRangedAttacks(world, FIXED_STEP)
    expect(world.hostileProjectiles).toHaveLength(0)
    stepRangedAttacks(world, FIXED_STEP)
    expect(world.hostileProjectiles).toHaveLength(1)
    expect(world.enemyShots).toBe(1)
    const shot = world.hostileProjectiles[0]
    expect(shot.x).toBeCloseTo(0)
    expect(shot.z).toBeCloseTo(-6)
    expect(shot.direction.x).toBeCloseTo(0, 10)
    expect(shot.direction.z).toBeCloseTo(1, 10)
    expect(world.enemies[0].attack).toBeNull()
    expect(world.enemies[0].attackCooldown).toBeCloseTo(RANGED.recovery, 10)
  })

  it('never starts an attack out of range or with cover between', () => {
    const blocked = createWorld('sabrina', true)
    blocked.enemies = [createEnemy(20, 5, 0, 'ranged')]
    blocked.enemies[0].attackCooldown = 0
    stepRangedAttacks(blocked, FIXED_STEP)
    expect(blocked.enemies[0].attack).toBeNull()

    const far = createWorld('sabrina', true)
    far.enemies = [createEnemy(21, 0, -11, 'ranged')]
    far.enemies[0].attackCooldown = 0
    stepRangedAttacks(far, FIXED_STEP)
    expect(far.enemies[0].attack).toBeNull()
  })

  it('stands still while warning, retreats when crowded, holds at preferred range', () => {
    const warning = createWorld('sabrina', true)
    warning.enemies = [createEnemy(20, 0, -7, 'ranged')]
    warning.enemies[0].attack = { remaining: 0.5, target: { x: 0, z: 0 } }
    const origin = { x: warning.enemies[0].x, z: warning.enemies[0].z }
    for (let i = 0; i < 10; i++) stepEnemies(warning, FIXED_STEP)
    expect(warning.enemies[0].x).toBe(origin.x)
    expect(warning.enemies[0].z).toBe(origin.z)

    const crowded = createWorld('sabrina', true)
    crowded.enemies = [createEnemy(21, 0, -3, 'ranged')]
    for (let i = 0; i < 90; i++) stepEnemies(crowded, FIXED_STEP)
    expect(Math.hypot(crowded.enemies[0].x - crowded.player.x, crowded.enemies[0].z - crowded.player.z))
      .toBeGreaterThanOrEqual(RANGED.retreatRange - 0.05)

    const holding = createWorld('sabrina', true)
    holding.enemies = [createEnemy(22, 0, 7, 'ranged')]
    for (let i = 0; i < 30; i++) stepEnemies(holding, FIXED_STEP)
    expect(Math.hypot(holding.enemies[0].x - holding.player.x, holding.enemies[0].z - holding.player.z)).toBeCloseTo(7, 1)
  })

  it('moves shots slowly, lets a moving player avoid them, stops them at cover', () => {
    const avoid = createWorld('sabrina', true)
    avoid.hostileProjectiles = [{ id: 30, x: 0, z: -8, direction: { x: 0, z: 1 }, remaining: RANGED.projectileRange }]
    for (let i = 0; i < 70; i++) {
      const start = { x: -0.1 * i, z: 0 }
      avoid.player = { x: -0.1 * (i + 1), z: 0 } // Sidestep after the shot was locked.
      stepEnemyProjectiles(avoid, FIXED_STEP, start)
    }
    expect(avoid.hostileProjectiles).toHaveLength(1)
    expect(avoid.health).toBe(100)

    const stationary = createWorld('sabrina', true)
    stationary.hostileProjectiles = [{ id: 31, x: 0, z: -8, direction: { x: 0, z: 1 }, remaining: RANGED.projectileRange }]
    for (let i = 0; i < 80 && stationary.health === 100; i++) stepEnemyProjectiles(stationary, FIXED_STEP)
    expect(stationary.health).toBe(100 - RANGED.damage)

    const cover = createWorld('sabrina', true)
    cover.hostileProjectiles = [{ id: 32, x: 6, z: 0, direction: { x: -1, z: 0 }, remaining: RANGED.projectileRange }]
    for (let i = 0; i < 20; i++) stepEnemyProjectiles(cover, FIXED_STEP)
    expect(cover.hostileProjectiles).toHaveLength(0)
    expect(cover.health).toBe(100)
  })

  it('draws the warning path no farther than cover allows', () => {
    const world = createWorld('sabrina', true)
    const enemy = createEnemy(40, 6, 0, 'ranged')
    enemy.attack = { remaining: RANGED.warning, target: { x: 0, z: 0 } }
    const path = warningPath(enemy, world.obstacles)
    expect(path.direction.x).toBeCloseTo(-1, 10)
    expect(path.end.x).toBeCloseTo(COMBAT_OBSTACLES[0].maxX + RANGED.projectileRadius, 6)
  })
})

describe('enemy separation', () => {
  it('separates overlapping enemies deterministically without entering cover', () => {
    const world = createWorld('sabrina', true)
    world.enemies = [createEnemy(30, 8, 0), createEnemy(31, 8, 0)]
    separateEnemies(world)
    const [a, b] = world.enemies
    expect(Math.hypot(b.x - a.x, b.z - a.z)).toBeGreaterThanOrEqual(PURSUER.radius * 2 - 1e-6)
    expect(Math.hypot(world.player.x, world.player.z)).toBe(0)

    const nearCover = createWorld('sabrina', true)
    nearCover.enemies = [createEnemy(32, 2.6, 0), createEnemy(33, 2.7, 0)]
    separateEnemies(nearCover)
    expect(nearCover.enemies[1].x).toBeLessThanOrEqual(COMBAT_OBSTACLES[0].minX - PURSUER.radius + 1e-6)
    expect(nearCover.enemies[0].x).toBeLessThan(2.6)
  })
})

describe('spawn pressure', () => {
  it('escalates phases at their recorded start times', () => {
    expect(pressureAt(0)).toBe(PRESSURE_PHASES[0])
    for (let i = 1; i < PRESSURE_PHASES.length; i++) {
      expect(pressureAt(PRESSURE_PHASES[i].start - 0.1)).toBe(PRESSURE_PHASES[i - 1])
      expect(pressureAt(PRESSURE_PHASES[i].start)).toBe(PRESSURE_PHASES[i])
    }
  })

  it('delays the first pressure spawn to four seconds and spaces the next', () => {
    const world = createWorld('sabrina', true)
    for (let i = 0; i < Math.round(4 / FIXED_STEP) - 1; i++) stepSpawning(world, FIXED_STEP)
    expect(world.enemies).toHaveLength(1)
    stepSpawning(world, FIXED_STEP)
    expect(world.enemies).toHaveLength(2)
    expect(world.enemies[1].kind).toBe('ranged')
    expect(world.spawnTimer).toBe(PRESSURE_PHASES[0].interval)
    for (let i = 0; i < Math.round(PRESSURE_PHASES[0].interval / FIXED_STEP) + 5; i++) stepSpawning(world, FIXED_STEP)
    expect(world.enemies).toHaveLength(3)
    expect(world.enemies[2].kind).toBe('pursuer')
  })

  it('keeps a safe distance and prefers out-of-view spawns', () => {
    const world = createWorld('sabrina', true)
    world.player = { x: 0, z: -14 } // Blocks the (0,-17) point at three units.
    world.spawnTimer = 0
    stepSpawning(world, FIXED_STEP)
    expect(world.enemies).toHaveLength(2)
    const spawned = world.enemies[1]
    expect(Math.hypot(spawned.x - world.player.x, spawned.z - world.player.z)).toBeGreaterThanOrEqual(MIN_SPAWN_DISTANCE)
    // Every other point is far away, so the fallback is never a close one.
    expect(Math.hypot(spawned.x - world.player.x, spawned.z - world.player.z)).toBeGreaterThanOrEqual(FAR_SPAWN_DISTANCE)
  })

  it('respects the phase alive cap without banking missed spawns', () => {
    const world = createWorld('sabrina', true)
    while (world.enemies.length < PRESSURE_PHASES[0].maxAlive) {
      world.enemies.push(createEnemy(30 + world.enemies.length, 8, world.enemies.length))
    }
    world.spawnTimer = 0
    stepSpawning(world, FIXED_STEP)
    expect(world.enemies).toHaveLength(PRESSURE_PHASES[0].maxAlive)
    world.enemies.pop()
    world.spawnTimer = 0
    stepSpawning(world, FIXED_STEP)
    expect(world.enemies).toHaveLength(PRESSURE_PHASES[0].maxAlive)
    expect(world.spawnTimer).toBe(PRESSURE_PHASES[0].interval)
  })

  it('limits concurrent ranged enemies to the phase cap', () => {
    const world = createWorld('sabrina', true)
    world.elapsed = PRESSURE_PHASES[2].start
    world.enemies = [createEnemy(30, 8, 0, 'ranged'), createEnemy(31, -8, 0, 'ranged')]
    world.spawnTimer = 0
    stepSpawning(world, FIXED_STEP)
    expect(world.enemies).toHaveLength(3)
    expect(world.enemies[2].kind).toBe('pursuer')
  })
})

describe('shared player damage gate', () => {
  it('shares the hurt interval between contact and ranged damage and respects the dash', () => {
    const world = createWorld('sabrina', true)
    expect(damagePlayer(world, PURSUER.damage)).toBe(true)
    expect(world.health).toBe(90)
    expect(damagePlayer(world, RANGED.damage)).toBe(false)
    world.hurtRemaining = 0
    expect(damagePlayer(world, RANGED.damage)).toBe(true)
    expect(world.health).toBe(75)
    world.dash.remaining = 0.1
    expect(damagePlayer(world, 10)).toBe(false)
    expect(world.health).toBe(75)
    world.health = 5
    world.dash.remaining = 0
    world.hurtRemaining = 0
    expect(damagePlayer(world, 50)).toBe(true)
    expect(world.health).toBe(0)
  })
})
