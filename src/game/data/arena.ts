export interface Obstacle { readonly id: string; readonly minX: number; readonly maxX: number; readonly minZ: number; readonly maxZ: number }
export const COMBAT_OBSTACLES: readonly Obstacle[] = [{ id: 'cover-east', minX: 3.5, maxX: 4.3, minZ: -2.2, maxZ: 2.2 }]
export const PURSUER = { id: 'pursuer', health: 40, speed: 1.8, radius: 0.45, damage: 10, contactInterval: 0.7 } as const
export const MAX_ENEMIES = 8
export const MAX_PROJECTILES = 192
export const SPAWN_INTERVAL = 2
