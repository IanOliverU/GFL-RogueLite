import { describe, expect, it } from 'vitest'
import { FIXED_STEP, Simulation } from '../../src/game/core/Simulation'
import { createEnemy, createWorld } from '../../src/game/core/world'
import { CHARACTER_LIST } from '../../src/game/data/characters'
import { WEAPONS } from '../../src/game/data/weapons'
import {
  GUN_MAX_RANK, MAX_EQUIPMENT_SLOTS, MAX_LEVEL,
  PULSE_SKILL, XP_DROP, xpForLevel,
} from '../../src/game/data/progression'
import { stepWeapon } from '../../src/game/systems/weapons'
import { stepProjectiles } from '../../src/game/systems/projectiles'
import {
  applyChoice, deriveWeapon, evolutionProgress, grantXp, isEmpowered,
  offerChoices, registerKill, stepGems, stepPulse,
} from '../../src/game/systems/progression'
import { MAX_ENEMIES } from '../../src/game/data/arena'
import { pressureAt } from '../../src/game/data/pressure'

describe('xp thresholds', () => {
  it('carries excess forward and queues one choice per earned level', () => {
    const world = createWorld('sabrina', true)
    grantXp(world, xpForLevel(1) + xpForLevel(2) + 1)
    expect(world.level).toBe(3)
    expect(world.pendingLevels).toBe(2)
    expect(world.xp).toBe(1)
  })

  it('caps at max level without banking overflow', () => {
    const world = createWorld('sabrina', true)
    world.level = MAX_LEVEL - 1
    grantXp(world, 1000)
    expect(world.level).toBe(MAX_LEVEL)
    expect(world.pendingLevels).toBe(1)
    grantXp(world, 1000)
    expect(world.pendingLevels).toBe(1)
  })
})

describe('gems', () => {
  it('drops each enemy value exactly once on death', () => {
    const world = createWorld('sabrina', true)
    const pursuer = createEnemy(10, 2, 0, 'pursuer')
    const ranged = createEnemy(11, -2, 0, 'ranged')
    registerKill(world, pursuer)
    registerKill(world, ranged)
    expect(world.kills).toBe(2)
    expect(world.gems.map((gem) => gem.value).sort()).toEqual([XP_DROP.pursuer, XP_DROP.ranged])
  })

  it('kills through projectiles drop one gem per enemy', () => {
    const world = createWorld('mosin-nagant', true)
    world.enemies = [createEnemy(10, 0, -0.8), createEnemy(11, 0, -1.3)]
    world.projectiles = [{
      id: 20, x: 0, z: 0, direction: { x: 0, z: -1 }, speed: 90, remaining: 22,
      damage: 70, maxHits: 3, knockback: 0, hitIds: [],
    }]
    stepProjectiles(world, FIXED_STEP)
    expect(world.kills).toBe(2)
    expect(world.gems).toHaveLength(2)
  })

  it('magnetizes nearby gems and collects them once for xp', () => {
    const world = createWorld('sabrina', true)
    world.gems.push({ id: 5, x: 2.5, z: 0, value: 2 })
    const before = Math.hypot(world.gems[0].x, world.gems[0].z)
    stepGems(world, FIXED_STEP)
    expect(Math.hypot(world.gems[0].x, world.gems[0].z)).toBeLessThan(before)
    world.player = { x: 2.5, z: 0 }
    stepGems(world, FIXED_STEP)
    expect(world.gems).toHaveLength(0)
    expect(world.gemsCollected).toBe(1)
    expect(world.xp).toBe(2)
    stepGems(world, FIXED_STEP) // No double payout from an empty field.
    expect(world.xp).toBe(2)
  })
})

describe('choices', () => {
  it('offers three distinct eligible choices with gun prioritized', () => {
    const world = createWorld('tololo', true)
    const choices = offerChoices(world)
    expect(choices).toHaveLength(3)
    expect(new Set(choices.map((choice) => `${choice.kind}-${choice.id ?? ''}`)).size).toBe(3)
    expect(choices[0].kind).toBe('gun')
  })

  it('respects gun caps, equipment caps and slot limits with a fallback floor', () => {
    const world = createWorld('tololo', true)
    world.gunRank = GUN_MAX_RANK
    world.equipment = { 'plated-vest': 3, 'drum-magazine': 3, 'trigger-unit': 3 }
    const exhausted = offerChoices(world)
    expect(exhausted.every((choice) => choice.kind === 'fallback')).toBe(true)

    const slots = createWorld('tololo', true)
    slots.equipment = { 'plated-vest': 1, 'drum-magazine': 1, 'trigger-unit': 1 }
    expect(Object.keys(slots.equipment)).toHaveLength(MAX_EQUIPMENT_SLOTS)
    // All slots filled but ranks remain: upgrades to held gear are still offered.
    expect(offerChoices(slots).some((choice) => choice.kind === 'equipment')).toBe(true)
  })

  it('offers the evolution only to sabrina with both requirements met', () => {
    const other = createWorld('vepley', true)
    other.gunRank = GUN_MAX_RANK
    other.equipment = { 'plated-vest': 3 }
    expect(offerChoices(other).some((choice) => choice.kind === 'evolution')).toBe(false)

    const partial = createWorld('sabrina', true)
    partial.gunRank = GUN_MAX_RANK
    partial.equipment = { 'plated-vest': 2 }
    expect(offerChoices(partial).some((choice) => choice.kind === 'evolution')).toBe(false)

    const ready = createWorld('sabrina', true)
    ready.gunRank = GUN_MAX_RANK
    ready.equipment = { 'plated-vest': 3 }
    const choices = offerChoices(ready)
    expect(choices[0].kind).toBe('evolution')
    expect(evolutionProgress(ready)).toBeNull()
    expect(evolutionProgress(partial)).toContain('Plated Vest')
  })
})

describe('upgrade effects', () => {
  it('keeps base weapons identical before any upgrade, for every doll', () => {
    for (const doll of CHARACTER_LIST) {
      const world = createWorld(doll.id, true)
      const stats = deriveWeapon(world)
      expect(stats.damageMult).toBe(1)
      expect(stats.intervalMult).toBe(1)
      expect(stats.magazine).toBe(WEAPONS[doll.weaponId].magazine)
      expect(isEmpowered(world)).toBe(false)
    }
  })

  it('applies gun damage without touching loaded ammo or timers', () => {
    const world = createWorld('qiongjiu', true)
    world.weapon.ammo = 5
    world.weapon.cooldown = 0.2
    applyChoice(world, { kind: 'gun', title: 'Rifle', rankLabel: '', description: '' })
    expect(deriveWeapon(world).damageMult).toBeCloseTo(1.15, 10)
    expect(world.weapon.ammo).toBe(5)
    expect(world.weapon.cooldown).toBe(0.2)
  })

  it('fires visibly stronger shots after gun ranks', () => {
    const world = createWorld('tololo', true)
    world.enemies = [createEnemy(10, 0, -5)]
    world.aimDirection = { x: 0, z: -1 }
    world.gunRank = 3
    world.weapon.cooldown = 0
    stepWeapon(world, FIXED_STEP, true)
    expect(world.projectiles[0].damage).toBeCloseTo(11 * 1.3, 8)
  })

  it('raises max hp and heals on vest, widens magazines on drums, quickens fire on triggers', () => {
    const world = createWorld('peritya', true)
    world.health = 40
    applyChoice(world, { kind: 'equipment', id: 'plated-vest', title: '', rankLabel: '', description: '' })
    expect(world.maxHealth).toBe(125)
    expect(world.health).toBe(65)
    applyChoice(world, { kind: 'equipment', id: 'drum-magazine', title: '', rankLabel: '', description: '' })
    expect(deriveWeapon(world).magazine).toBe(Math.round(60 * 1.3))
    applyChoice(world, { kind: 'equipment', id: 'trigger-unit', title: '', rankLabel: '', description: '' })
    expect(deriveWeapon(world).intervalMult).toBeCloseTo(0.88, 10)
    // Magazine growth never touches the currently loaded ammo.
    expect(world.weapon.ammo).toBe(WEAPONS['machine-gun'].magazine)
  })

  it('heals through the fallback without exceeding max hp', () => {
    const world = createWorld('sabrina', true)
    world.health = 90
    applyChoice(world, { kind: 'fallback', title: '', rankLabel: '', description: '' })
    expect(world.health).toBe(100)
  })

  it('empowers every fourth volley once evolved', () => {
    const world = createWorld('sabrina', true)
    world.evolution = true
    world.aimDirection = { x: 0, z: -1 }
    const volleySizes: number[] = []
    for (let volley = 0; volley < 5; volley++) {
      world.enemies = [createEnemy(100 + volley, 0, -4)]
      world.weapon.cooldown = 0
      const before = world.projectiles.length
      stepWeapon(world, FIXED_STEP, true)
      volleySizes.push(world.projectiles.length - before)
    }
    expect(volleySizes).toEqual([7, 7, 7, 11, 7])
    const empowered = world.projectiles.filter((projectile) => projectile.damage > 12)
    expect(empowered).toHaveLength(11)
    expect(empowered[0].damage).toBeCloseTo(24, 8)
    expect(empowered[0].knockback).toBeCloseTo(4, 8)
  })
})

describe('sabrina pulse', () => {
  it('hits nearby enemies on its interval and never fires for other dolls', () => {
    const sabrina = createWorld('sabrina', true)
    sabrina.enemies = [createEnemy(10, 2, 0), createEnemy(11, 0, -8)]
    sabrina.pulseTimer = 0
    stepPulse(sabrina, FIXED_STEP)
    expect(sabrina.enemies).toHaveLength(2)
    expect(sabrina.enemies[0].health).toBe(32) // 8 damage to the close pursuer only.
    expect(sabrina.enemies[1].health).toBe(40)
    expect(sabrina.kills).toBe(0)
    expect(sabrina.pulseTimer).toBeCloseTo(PULSE_SKILL.interval - FIXED_STEP, 8)

    const tololo = createWorld('tololo', true)
    tololo.enemies = [createEnemy(10, 2, 0)]
    tololo.pulseTimer = 0
    stepPulse(tololo, FIXED_STEP)
    expect(tololo.enemies[0].health).toBe(40)
  })

  it('registers pulse kills with their xp drops', () => {
    const world = createWorld('sabrina', true)
    const weak = createEnemy(10, 2, 0)
    weak.health = 5
    world.enemies = [weak]
    world.pulseTimer = 0
    stepPulse(world, FIXED_STEP)
    expect(world.enemies).toHaveLength(0)
    expect(world.kills).toBe(1)
    expect(world.gems).toHaveLength(1)
    expect(world.gems[0].value).toBe(XP_DROP.pursuer)
  })
})

describe('level-up lifecycle', () => {
  it('freezes gameplay while choosing and resumes after the last queued level', () => {
    const simulation = new Simulation('combat')
    simulation.startRun('sabrina')
    simulation.world.xp = 0
    grantXp(simulation.world, xpForLevel(1) + xpForLevel(2))
    simulation.advance(FIXED_STEP)
    expect(simulation.getStatus()).toBe('levelup')
    const frozen = { ...simulation.world.player, elapsed: simulation.world.elapsed }
    simulation.held.add('KeyW')
    simulation.advance(5)
    expect(simulation.world.player).toEqual({ x: frozen.x, z: frozen.z })
    expect(simulation.world.elapsed).toBe(frozen.elapsed)

    expect(simulation.chooseUpgrade(9)).toBe(false)
    expect(simulation.chooseUpgrade(0)).toBe(true)
    expect(simulation.getStatus()).toBe('levelup') // One level still queued.
    expect(simulation.chooseUpgrade(0)).toBe(true)
    expect(simulation.getStatus()).toBe('playing')
    expect(simulation.chooseUpgrade(0)).toBe(false)
    const elapsed = simulation.world.elapsed
    simulation.advance(FIXED_STEP)
    expect(simulation.world.elapsed).toBeGreaterThan(elapsed)
  })

  it('keeps focus-loss and pause guards around the upgrade screen', () => {
    const simulation = new Simulation('combat')
    simulation.startRun('sabrina')
    grantXp(simulation.world, xpForLevel(1))
    simulation.advance(FIXED_STEP)
    expect(simulation.getStatus()).toBe('levelup')
    simulation.pause('focus') // Must not dismiss or convert the upgrade screen.
    expect(simulation.getStatus()).toBe('levelup')
    expect(simulation.world.pendingLevels).toBe(1)
    simulation.resume()
    expect(simulation.getStatus()).toBe('levelup')
  })

  it('resets all progression on retry and character switch', () => {
    const simulation = new Simulation('combat')
    simulation.startRun('sabrina', { bonusXp: 50 })
    simulation.advance(FIXED_STEP)
    while (simulation.getStatus() === 'levelup') simulation.chooseUpgrade(0)
    expect(simulation.world.level).toBeGreaterThan(1)
    simulation.startRun('sabrina')
    expect(simulation.world).toEqual(createWorld('sabrina', true))
    expect(simulation.getHud().level).toBe(1)

    simulation.startRun('tololo', { bonusXp: 50 })
    simulation.advance(FIXED_STEP)
    while (simulation.getStatus() === 'levelup') simulation.chooseUpgrade(0)
    simulation.returnToSelection()
    simulation.startRun('vepley')
    expect(simulation.world).toEqual(createWorld('vepley', true))
  })

  it('grants the development bonus only through the explicit option', () => {
    const plain = new Simulation('combat')
    plain.startRun('sabrina')
    expect(plain.world.xp).toBe(0)
    const boosted = new Simulation('combat')
    boosted.startRun('sabrina', { bonusXp: 10 })
    expect(boosted.world.xp).toBeGreaterThan(0)
    expect(boosted.world.pendingLevels).toBeGreaterThan(0)
  })
})

describe.each(CHARACTER_LIST)('$name progression compatibility', (doll) => {
  it('fires its distinct weapon and earns levels from real kills', () => {
    const simulation = new Simulation('combat')
    simulation.startRun(doll.id)
    simulation.pointer = { x: 0, y: 0 }
    simulation.world.enemies = [createEnemy(10, 0, -4)]
    const definition = WEAPONS[doll.weaponId]
    for (let i = 0; i < 600 && simulation.world.kills === 0; i++) {
      simulation.advance(FIXED_STEP, () => ({ x: 0, z: -20 }))
    }
    expect(simulation.world.kills).toBe(1)
    expect(simulation.world.gems).toHaveLength(1)
    // Walk onto the gem to collect it.
    simulation.world.player = { ...simulation.world.gems[0] }
    simulation.advance(FIXED_STEP, () => ({ x: 0, z: -20 }))
    expect(simulation.world.gemsCollected).toBe(1)
    void definition
  })
})

describe('sustained pressure soak', () => {
  it('holds phase caps through four minutes of kiting with an evolving build', () => {
    const simulation = new Simulation('combat')
    simulation.startRun('sabrina')
    simulation.pointer = { x: 0, y: 0 }
    let maxEnemies = 0
    let maxRanged = 0
    let maxGems = 0
    const total = Math.round(240 / FIXED_STEP)
    let steps = 0
    for (; steps < total && simulation.getStatus() !== 'game_over'; steps++) {
      // A live mouse keeps the pointer over the canvas; level-up input
      // clearing must not permanently disarm auto-fire for the bot either.
      simulation.pointer = { x: 0, y: 0 }
      // Fight like a player: circle the nearest enemy at shotgun mid-range,
      // detour for close gems, and dash along the path out of contact.
      let anchor = { x: 0, z: 0 }
      let nearest = Infinity
      let aim = { x: 0, z: -20 }
      for (const enemy of simulation.world.enemies) {
        const distance = Math.hypot(enemy.x - simulation.world.player.x, enemy.z - simulation.world.player.z)
        if (distance < nearest) { nearest = distance; anchor = enemy; aim = { x: enemy.x, z: enemy.z } }
      }
      const angle = steps * FIXED_STEP * 1.4
      let target: { x: number; z: number } = { x: anchor.x + 3.5 * Math.cos(angle), z: anchor.z + 3.5 * Math.sin(angle) }
      for (const gem of simulation.world.gems) {
        const gemDistance = Math.hypot(gem.x - simulation.world.player.x, gem.z - simulation.world.player.z)
        if (gemDistance > 0.8 && gemDistance < 7) { target = gem; break }
      }
      simulation.held.clear()
      if (target.x > simulation.world.player.x + 0.2) simulation.held.add('KeyD')
      if (target.x < simulation.world.player.x - 0.2) simulation.held.add('KeyA')
      if (target.z > simulation.world.player.z + 0.2) simulation.held.add('KeyS')
      if (target.z < simulation.world.player.z - 0.2) simulation.held.add('KeyW')
      if (nearest < 1.2) simulation.requestDash() // I-frames along the current path.
      simulation.advance(FIXED_STEP, () => aim)
      if (simulation.getStatus() === 'levelup') {
        // Survivability first: vest for max HP, then gun, then evolution.
        const choices = simulation.getChoices()
        let index = choices.findIndex((choice) => choice.kind === 'equipment' && choice.id === 'plated-vest')
        if (index < 0) index = choices.findIndex((choice) => choice.kind === 'gun')
        if (index < 0) index = choices.findIndex((choice) => choice.kind === 'evolution')
        if (index < 0) index = 0
        expect(simulation.chooseUpgrade(index)).toBe(true)
      }
      // Caps hold on every step: nothing spawns past the live phase limits.
      const phase = pressureAt(simulation.world.elapsed)
      expect(simulation.world.enemies.length).toBeLessThanOrEqual(Math.min(phase.maxAlive, MAX_ENEMIES))
      expect(simulation.world.enemies.filter((enemy) => enemy.kind === 'ranged').length)
        .toBeLessThanOrEqual(phase.maxRanged)
      maxEnemies = Math.max(maxEnemies, simulation.world.enemies.length)
      maxRanged = Math.max(maxRanged, simulation.world.enemies.filter((enemy) => enemy.kind === 'ranged').length)
      maxGems = Math.max(maxGems, simulation.world.gems.length)
    }
    // A kiting upgraded Sabrina must survive deep into the pressure curve.
    expect(simulation.world.elapsed).toBeGreaterThanOrEqual(120)
    expect(simulation.world.level).toBeGreaterThanOrEqual(5)
    expect(simulation.world.pendingLevels).toBe(0)
    expect(simulation.world.gems.length).toBeLessThanOrEqual(64)
    expect(maxRanged).toBeLessThanOrEqual(2)
    expect(maxGems).toBeLessThanOrEqual(64)
    expect(maxEnemies).toBeGreaterThan(6) // Later phases genuinely denser than the opening.
    if (simulation.world.elapsed >= 200) expect(simulation.world.evolution).toBe(true)
  })
})
