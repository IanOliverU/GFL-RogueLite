import { ARENA_HALF_SIZE, PLAYER_RADIUS, PLAYER_SPEED, type GroundPoint } from '../core/world'

export function movePlayer(position: GroundPoint, held: ReadonlySet<string>, dt: number): void {
  const x = Number(held.has('KeyD')) - Number(held.has('KeyA'))
  const z = Number(held.has('KeyS')) - Number(held.has('KeyW'))
  const length = Math.hypot(x, z)
  if (!length) return
  const limit = ARENA_HALF_SIZE - PLAYER_RADIUS
  position.x = Math.max(-limit, Math.min(limit, position.x + x / length * PLAYER_SPEED * dt))
  position.z = Math.max(-limit, Math.min(limit, position.z + z / length * PLAYER_SPEED * dt))
}
