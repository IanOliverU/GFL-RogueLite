import { PLAYER_RADIUS, type GroundPoint, type World } from '../core/world'
import { RANGED } from '../data/arena'
import { boundaryHit, segmentBox, segmentCircle } from './collision'
import { damagePlayer } from './damage'

export function stepEnemyProjectiles(world: World, dt: number, playerStart: GroundPoint = world.player) {
  world.hostileProjectiles = world.hostileProjectiles.filter((projectile) => {
    const travel = Math.min(projectile.remaining, RANGED.projectileSpeed * dt)
    const end = { x: projectile.x + projectile.direction.x * travel, z: projectile.z + projectile.direction.z * travel }
    let wall = boundaryHit(projectile, end) ?? Infinity
    for (const box of world.obstacles) wall = Math.min(wall, segmentBox(projectile, end, box, RANGED.projectileRadius) ?? Infinity)
    // Relative sweep includes player movement, so crossing a bullet at dash speed cannot tunnel.
    const hit = segmentCircle({ x: projectile.x - playerStart.x, z: projectile.z - playerStart.z }, { x: end.x - world.player.x, z: end.z - world.player.z }, { x: 0, z: 0 }, PLAYER_RADIUS + RANGED.projectileRadius)
    if (hit !== null && hit < wall) {
      if (world.dash.remaining > 0) world.dodgedShots++
      damagePlayer(world, RANGED.damage)
      return false
    }
    if (wall !== Infinity) return false
    projectile.x = end.x
    projectile.z = end.z
    projectile.remaining -= travel
    return projectile.remaining > 1e-8
  })
}
