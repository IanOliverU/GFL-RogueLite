import type { World } from '../core/world'
import { PURSUER } from '../data/arena'

export function damagePlayer(world: World, damage: number): boolean {
  if (world.health <= 0 || world.dash.remaining > 0 || world.hurtRemaining > 1e-8) return false
  world.health = Math.max(0, world.health - damage)
  world.hurtRemaining = PURSUER.contactInterval
  return true
}
