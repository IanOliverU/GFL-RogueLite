export interface GroundPoint { x: number; z: number }
export interface World {
  player: GroundPoint
  aimDirection: GroundPoint
  aimTarget: GroundPoint | null
  elapsed: number
}

export const ARENA_HALF_SIZE = 12
export const PLAYER_RADIUS = 0.4
export const PLAYER_SPEED = 6

export function createWorld(): World {
  return { player: { x: 0, z: 0 }, aimDirection: { x: 0, z: -1 }, aimTarget: null, elapsed: 0 }
}
