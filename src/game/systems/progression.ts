import { CHARACTERS } from '../data/characters'
import { WEAPONS } from '../data/weapons'
import {
  EQUIPMENT, EQUIPMENT_LIST, EVOLUTION, FALLBACK_HEAL, GEM_MAGNET_RADIUS, GEM_MAGNET_SPEED,
  GEM_PICKUP_RADIUS, GUN_DAMAGE_PER_RANK, GUN_MAX_RANK, MAX_EQUIPMENT_SLOTS, MAX_GEMS,
  MAX_LEVEL, PULSE_SKILL, XP_DROP, xpForLevel, type UpgradeChoice,
} from '../data/progression'
import type { Enemy, World } from '../core/world'

/** Derived per-volley weapon stats from base definition plus run upgrades. */
export function deriveWeapon(world: World) {
  const definition = WEAPONS[CHARACTERS[world.dollId].weaponId]
  const triggerRank = world.equipment['trigger-unit'] ?? 0
  const drumRank = world.equipment['drum-magazine'] ?? 0
  return {
    damageMult: 1 + GUN_DAMAGE_PER_RANK * (world.gunRank - 1),
    intervalMult: Math.pow(0.88, triggerRank),
    magazine: Math.max(1, Math.round(definition.magazine * (1 + 0.3 * drumRank))),
  }
}

/** True while an empowered volley is due (Sabrina evolution, every 4th volley). */
export function isEmpowered(world: World): boolean {
  return world.evolution && world.volleys % 4 === 3
}

/** Register a kill: count it and drop the enemy's XP exactly once. */
export function registerKill(world: World, enemy: Enemy): void {
  world.kills++
  const value = XP_DROP[enemy.kind]
  if (world.gems.length >= MAX_GEMS) {
    // Overflow merges into the oldest gem so no earned XP is ever lost.
    world.gems[0].value += value
    return
  }
  world.gems.push({ id: world.nextId++, x: enemy.x, z: enemy.z, value })
}

/** Grant XP, carrying excess forward and queueing one choice per earned level. */
export function grantXp(world: World, value: number): void {
  world.xp += value
  while (world.level < MAX_LEVEL && world.xp >= xpForLevel(world.level)) {
    world.xp -= xpForLevel(world.level)
    world.level++
    world.pendingLevels++
  }
}

export function stepGems(world: World, dt: number): void {
  const kept: typeof world.gems = []
  for (const gem of world.gems) {
    const dx = world.player.x - gem.x, dz = world.player.z - gem.z
    const distance = Math.hypot(dx, dz)
    if (distance <= GEM_PICKUP_RADIUS) {
      grantXp(world, gem.value)
      world.gemsCollected++
      continue
    }
    if (distance < GEM_MAGNET_RADIUS && distance > 1e-8) {
      const pull = Math.min(distance, GEM_MAGNET_SPEED * dt)
      gem.x += dx / distance * pull
      gem.z += dz / distance * pull
    }
    kept.push(gem)
  }
  world.gems = kept
}

/** Sabrina's automatic knockback pulse; other dolls never trigger it. */
export function stepPulse(world: World, dt: number): void {
  if (world.dollId !== 'sabrina') return
  world.pulseTimer -= dt
  if (world.pulseTimer > 1e-8) return
  world.pulseTimer += PULSE_SKILL.interval
  for (const enemy of world.enemies) {
    const dx = enemy.x - world.player.x, dz = enemy.z - world.player.z
    const distance = Math.hypot(dx, dz)
    if (distance > PULSE_SKILL.radius || enemy.health <= 0) continue
    const push = distance > 1e-8 ? PULSE_SKILL.knockback / Math.max(1, distance) : PULSE_SKILL.knockback
    enemy.health -= PULSE_SKILL.damage
    enemy.hitFlash = 0.12
    enemy.knockback.x += distance > 1e-8 ? dx / distance * push : 0
    enemy.knockback.z += distance > 1e-8 ? dz / distance * push : 0
    if (enemy.health <= 0) registerKill(world, enemy)
  }
  world.enemies = world.enemies.filter((enemy) => enemy.health > 0)
}

function gunChoice(world: World): UpgradeChoice | null {
  if (world.gunRank >= GUN_MAX_RANK) return null
  const weapon = WEAPONS[CHARACTERS[world.dollId].weaponId]
  return {
    kind: 'gun', title: `${weapon.name}`,
    rankLabel: `Rank ${world.gunRank} -> ${world.gunRank + 1}`,
    description: `+${Math.round(GUN_DAMAGE_PER_RANK * 100)}% projectile damage (now x${(1 + GUN_DAMAGE_PER_RANK * (world.gunRank - 1)).toFixed(2)}).`,
  }
}

function equipmentChoices(world: World): UpgradeChoice[] {
  const held = Object.keys(world.equipment)
  return EQUIPMENT_LIST.flatMap((definition) => {
    const rank = world.equipment[definition.id] ?? 0
    if (rank >= definition.maxRank) return []
    if (rank === 0 && held.length >= MAX_EQUIPMENT_SLOTS) return []
    return [{
      kind: 'equipment' as const, id: definition.id, title: definition.name,
      rankLabel: rank === 0 ? 'New gear' : `Rank ${rank} -> ${rank + 1}`,
      description: definition.description,
    }]
  })
}

function evolutionChoice(world: World): UpgradeChoice | null {
  if (world.evolution || world.dollId !== EVOLUTION.dollId) return null
  if (world.gunRank < EVOLUTION.requiresGunRank) return null
  if ((world.equipment[EVOLUTION.requiresEquipment.id] ?? 0) < EVOLUTION.requiresEquipment.rank) return null
  return { kind: 'evolution', title: EVOLUTION.name, rankLabel: 'EVOLUTION', description: EVOLUTION.description }
}

function fallbackChoice(): UpgradeChoice {
  return { kind: 'fallback', title: 'Field Rations', rankLabel: '', description: `Restore ${FALLBACK_HEAL} HP now. Always available.` }
}

/**
 * Three distinct eligible choices. Gun and evolution are prioritized when
 * eligible so the evolution stays reachable; the rest rotate deterministically
 * so offers are reproducible run to run.
 */
export function offerChoices(world: World): UpgradeChoice[] {
  const picks: UpgradeChoice[] = []
  const evolution = evolutionChoice(world)
  if (evolution) picks.push(evolution)
  const gun = gunChoice(world)
  if (gun) picks.push(gun)
  const rotating = equipmentChoices(world)
  if (picks.length < 3 && rotating.length > 0) {
    const start = world.choiceSeed % rotating.length
    for (let i = 0; i < rotating.length && picks.length < 3; i++) picks.push(rotating[(start + i) % rotating.length])
  }
  while (picks.length < 3) picks.push(fallbackChoice())
  return picks.slice(0, 3)
}

/** Human-readable evolution progress; null once evolved or already offered. */
export function evolutionProgress(world: World): string | null {
  if (world.dollId !== EVOLUTION.dollId || world.evolution) return null
  const vest = world.equipment[EVOLUTION.requiresEquipment.id] ?? 0
  if (world.gunRank >= EVOLUTION.requiresGunRank && vest >= EVOLUTION.requiresEquipment.rank) return null
  return `Evolution: ${EVOLUTION.name} needs gun rank ${EVOLUTION.requiresGunRank} (now ${world.gunRank}) + ${EQUIPMENT[EVOLUTION.requiresEquipment.id].name} rank ${EVOLUTION.requiresEquipment.rank} (now ${vest}).`
}

/** Apply a choice without touching live weapon state (ammo, cooldowns, bursts). */
export function applyChoice(world: World, choice: UpgradeChoice): void {
  switch (choice.kind) {
    case 'gun':
      world.gunRank = Math.min(GUN_MAX_RANK, world.gunRank + 1)
      break
    case 'equipment': {
      const definition = EQUIPMENT[choice.id as keyof typeof EQUIPMENT]
      world.equipment[definition.id] = Math.min(definition.maxRank, (world.equipment[definition.id] ?? 0) + 1)
      if (definition.id === 'plated-vest') {
        world.maxHealth += 25
        world.health = Math.min(world.maxHealth, world.health + 25)
      }
      break
    }
    case 'evolution':
      world.evolution = true
      break
    case 'fallback':
      world.health = Math.min(world.maxHealth, world.health + FALLBACK_HEAL)
      break
  }
  world.upgradesTaken++
  world.choiceSeed++
}
