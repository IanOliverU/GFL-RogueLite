import type { World } from '../core/world'
import { CHARACTERS } from '../data/characters'
import { MAX_PROJECTILES } from '../data/arena'
import { WEAPONS } from '../data/weapons'

export function stepWeapon(world: World, dt: number, aimActive: boolean) {
  const definition = WEAPONS[CHARACTERS[world.dollId].weaponId]
  const state = world.weapon
  state.cooldown = state.cooldown > 0 ? state.cooldown - dt : 0
  if (state.reloadRemaining > 0) {
    state.reloadRemaining = Math.max(0, state.reloadRemaining - dt)
    if (state.reloadRemaining > 1e-8) return
    state.reloadRemaining = 0
    state.ammo = definition.magazine
    state.cooldown = 0
  }
  const inRange = world.enemies.some((enemy) => enemy.health > 0 && Math.hypot(enemy.x - world.player.x, enemy.z - world.player.z) <= definition.range)
  if (!aimActive || !inRange) {
    // Cancel unfinished bursts when the firing gate closes; no queued catch-up salvo.
    state.burstRemaining = 0
    state.cooldown = Math.max(0, state.cooldown)
    return
  }
  if (state.cooldown > 1e-8 || world.projectiles.length + definition.pellets > MAX_PROJECTILES) return
  if (state.burstRemaining === 0) state.burstRemaining = definition.burstSize
  for (let pellet = 0; pellet < definition.pellets; pellet++) {
    const angle = definition.pellets === 1 ? 0 : (pellet / (definition.pellets - 1) - 0.5) * definition.spreadDegrees * Math.PI / 180
    const direction = { x: world.aimDirection.x * Math.cos(angle) - world.aimDirection.z * Math.sin(angle), z: world.aimDirection.x * Math.sin(angle) + world.aimDirection.z * Math.cos(angle) }
    world.projectiles.push({ id: world.nextId++, ...world.player, direction, speed: definition.projectileSpeed, remaining: definition.range, damage: definition.damage, maxHits: definition.maxHits, knockback: definition.knockback, hitIds: [] })
  }
  world.shots++
  state.ammo--
  state.burstRemaining--
  // Carry only the sub-step remainder; rates such as 0.09 s stay frame independent.
  state.cooldown = Math.max(-dt, state.cooldown) + (state.burstRemaining > 0 ? definition.burstInterval : definition.interval)
  if (state.ammo === 0) {
    state.reloadRemaining = definition.reload
    state.burstRemaining = 0
    world.reloads++
  }
}
