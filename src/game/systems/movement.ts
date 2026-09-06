import { PLAYER_RADIUS, PLAYER_SPEED, type GroundPoint } from '../core/world'
import type { Obstacle } from '../data/arena'
import { moveCircle } from './collision'

export function movePlayer(position: GroundPoint, held: ReadonlySet<string>, dt: number, obstacles: readonly Obstacle[] = []): void {
  const x = Number(held.has('KeyD')) - Number(held.has('KeyA'))
  const z = Number(held.has('KeyS')) - Number(held.has('KeyW'))
  const length = Math.hypot(x, z)
  if (!length) return
  moveCircle(position, x / length * PLAYER_SPEED * dt, z / length * PLAYER_SPEED * dt, PLAYER_RADIUS, obstacles)
}
