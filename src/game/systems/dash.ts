import { PLAYER_RADIUS, type World } from '../core/world'
import { DASH } from '../data/dash'
import { screenBasis } from '../data/camera'
import { moveCircleSwept } from './collision'

export function stepDash(world: World, held: ReadonlySet<string>, requested: boolean, dt: number, yawRadians = 0): boolean {
  const dash = world.dash
  dash.cooldown = Math.max(0, dash.cooldown - dt)
  if (requested && dash.cooldown <= 1e-8 && dash.remaining === 0) {
    const forward = Number(held.has('KeyW')) - Number(held.has('KeyS'))
    const strafe = Number(held.has('KeyD')) - Number(held.has('KeyA'))
    const basis = screenBasis(yawRadians)
    const x = basis.up.x * forward + basis.right.x * strafe
    const z = basis.up.z * forward + basis.right.z * strafe
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
