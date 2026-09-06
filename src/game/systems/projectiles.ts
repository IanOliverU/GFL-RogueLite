import type { World } from '../core/world'
import { ENEMY_DEFINITIONS } from '../data/arena'
import { boundaryHit, segmentBox, segmentCircle } from './collision'

export function stepProjectiles(world: World, dt: number) {
  world.projectiles = world.projectiles.filter((projectile) => {
    const travel = Math.min(projectile.remaining, projectile.speed * dt)
    const end = { x: projectile.x + projectile.direction.x * travel, z: projectile.z + projectile.direction.z * travel }
    let wall = boundaryHit(projectile, end) ?? Infinity
    for (const obstacle of world.obstacles) wall = Math.min(wall, segmentBox(projectile, end, obstacle, 0.045) ?? Infinity)
    const hits = world.enemies.flatMap((enemy) => {
      if (enemy.health <= 0 || projectile.hitIds.includes(enemy.id)) return []
      const t = segmentCircle(projectile, end, enemy, ENEMY_DEFINITIONS[enemy.kind].radius + 0.045)
      return t !== null && t < wall ? [{ enemy, t }] : []
    }).sort((a, b) => a.t - b.t || a.enemy.id - b.enemy.id)
    for (const { enemy } of hits) {
      projectile.hitIds.push(enemy.id)
      world.damageDealt += Math.min(enemy.health, projectile.damage)
      enemy.health -= projectile.damage
      enemy.hitFlash = 0.12
      // Refresh, do not sum pellet impulses; a volley has a bounded displacement.
      enemy.knockback.x = projectile.direction.x * projectile.knockback
      enemy.knockback.z = projectile.direction.z * projectile.knockback
      world.hits++
      if (enemy.health <= 0) world.kills++
      if (projectile.hitIds.length >= projectile.maxHits) return false
    }
    if (wall !== Infinity) return false
    projectile.x = end.x
    projectile.z = end.z
    projectile.remaining -= travel
    return projectile.remaining > 1e-8
  })
  world.enemies = world.enemies.filter((enemy) => enemy.health > 0)
}
