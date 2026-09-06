import { PLAYER_RADIUS, type World } from '../core/world'
import { DASH } from '../data/dash'
import { moveCircleSwept } from './collision'

export function stepDash(world: World, held: ReadonlySet<string>, requested: boolean, dt: number): boolean {
  const dash = world.dash
  dash.cooldown = Math.max(0, dash.cooldown - dt)
  if (requested && dash.cooldown <= 1e-8 && dash.remaining === 0) {
    const x = Number(held.has('KeyD')) - Number(held.has('KeyA'))
    const z = Number(held.has('KeyS')) - Number(held.has('KeyW'))
    const length = Math.hypot(x, z)
    dash.direction = length > 0 ? { x: x / length, z: z / length } : { ...world.aimDirection }
    dash.origin = { ...world.player }
    dash.remaining = DASH.duration
    dash.cooldown = DASH.cooldown
    world.dashes++
  }
  if (dash.remaining <= 0) return false
  const distance = DASH.speed * Math.min(dt, dash.remaining)
  moveCircleSwept(world.player, dash.direction.x * distance, dash.direction.z * distance, PLAYER_RADIUS, world.obstacles)
  return true
}

/** Called after collision/damage so the final dash step is protected as well. */
export function finishDashStep(world: World, dt: number) {
  world.dash.remaining = Math.max(0, world.dash.remaining - dt)
  if (world.dash.remaining < 1e-8) world.dash.remaining = 0
}
