import { PLAYER_RADIUS, PLAYER_SPEED, type GroundPoint } from '../core/world'
import type { Obstacle } from '../data/arena'
import { moveCircle } from './collision'
import { screenBasis } from '../data/camera'

export function movePlayer(position: GroundPoint, held: ReadonlySet<string>, dt: number, obstacles: readonly Obstacle[] = [], yawRadians = 0): void {
  const forward = Number(held.has('KeyW')) - Number(held.has('KeyS'))
  const strafe = Number(held.has('KeyD')) - Number(held.has('KeyA'))
  if (!forward && !strafe) return
  const basis = screenBasis(yawRadians)
  const x = basis.up.x * forward + basis.right.x * strafe
  const z = basis.up.z * forward + basis.right.z * strafe
  const length = Math.hypot(x, z)
  if (!length) return
  moveCircle(position, x / length * PLAYER_SPEED * dt, z / length * PLAYER_SPEED * dt, PLAYER_RADIUS, obstacles)
}
