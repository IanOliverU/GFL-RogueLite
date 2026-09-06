import type { World } from '../core/world'
import { ENEMY_DEFINITIONS } from '../data/arena'
import { moveCircle } from './collision'

/** Bounded, deterministic soft separation; never moves the player or ignores cover. */
export function separateEnemies(world: World) {
  for (let iteration = 0; iteration < 6; iteration++) {
    for (let i = 0; i < world.enemies.length; i++) for (let j = i + 1; j < world.enemies.length; j++) {
      const a = world.enemies[i], b = world.enemies[j]
      const radiusA = ENEMY_DEFINITIONS[a.kind].radius, radiusB = ENEMY_DEFINITIONS[b.kind].radius
      const dx = b.x - a.x, dz = b.z - a.z
      const distance = Math.hypot(dx, dz)
      const overlap = radiusA + radiusB + 0.04 - distance
      if (overlap <= 0) continue
      const angle = (a.id + b.id * 0.618) * 2.4
      const nx = distance > 1e-8 ? dx / distance : Math.cos(angle)
      const nz = distance > 1e-8 ? dz / distance : Math.sin(angle)
      const push = Math.min(overlap / 2, 0.08)
      moveCircle(a, -nx * push, -nz * push, radiusA, world.obstacles)
      moveCircle(b, nx * push, nz * push, radiusB, world.obstacles)
    }
  }
}
