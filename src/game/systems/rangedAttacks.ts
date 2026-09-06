import type { Enemy, GroundPoint, World } from '../core/world'
import { MAX_HOSTILE_PROJECTILES, RANGED, type Obstacle } from '../data/arena'
import { boundaryHit, segmentBox } from './collision'

export function warningPath(enemy: Enemy, obstacles: readonly Obstacle[]) {
  const target = enemy.attack?.target ?? enemy
  const dx = target.x - enemy.x, dz = target.z - enemy.z
  const length = Math.hypot(dx, dz)
  const direction: GroundPoint = length > 1e-8 ? { x: dx / length, z: dz / length } : { x: 0, z: -1 }
  const end = { x: enemy.x + direction.x * RANGED.projectileRange, z: enemy.z + direction.z * RANGED.projectileRange }
  let fraction = boundaryHit(enemy, end) ?? 1
  for (const box of obstacles) fraction = Math.min(fraction, segmentBox(enemy, end, box, RANGED.projectileRadius) ?? 1)
  return { direction, end: { x: enemy.x + (end.x - enemy.x) * fraction, z: enemy.z + (end.z - enemy.z) * fraction } }
}

export function stepRangedAttacks(world: World, dt: number) {
  for (const enemy of world.enemies) {
    if (enemy.kind !== 'ranged' || enemy.health <= 0) continue
    if (enemy.attack) {
      enemy.attack.remaining = Math.max(0, enemy.attack.remaining - dt)
      if (enemy.attack.remaining > 1e-8) continue
      if (world.hostileProjectiles.length < MAX_HOSTILE_PROJECTILES) {
        const path = warningPath(enemy, world.obstacles)
        world.hostileProjectiles.push({ id: world.nextId++, x: enemy.x, z: enemy.z, direction: path.direction, remaining: RANGED.projectileRange })
        world.enemyShots++
      }
      enemy.attack = null
      enemy.attackCooldown = RANGED.recovery
      continue
    }
    enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt)
    if (enemy.attackCooldown > 1e-8 || Math.hypot(enemy.x - world.player.x, enemy.z - world.player.z) > RANGED.attackRange) continue
    if (world.obstacles.some((box) => segmentBox(enemy, world.player, box, RANGED.projectileRadius) !== null)) continue
    // Lock the target at warning onset. It never tracks the player's dodge.
    enemy.attack = { remaining: RANGED.warning, target: { ...world.player } }
  }
}
