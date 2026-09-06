export interface Obstacle { readonly id: string; readonly minX: number; readonly maxX: number; readonly minZ: number; readonly maxZ: number }
export const COMBAT_OBSTACLES: readonly Obstacle[] = [{ id: 'cover-east', minX: 3.5, maxX: 4.3, minZ: -2.2, maxZ: 2.2 }]
export const PURSUER = { id: 'pursuer', health: 40, speed: 1.8, radius: 0.45, damage: 10, contactInterval: 0.7 } as const
export const RANGED = {
  id: 'ranged', health: 50, speed: 1.2, radius: 0.5, damage: 15,
  warning: 0.9, recovery: 2.8, initialDelay: 1.2,
  attackRange: 10, preferredRange: 7, retreatRange: 4,
  projectileSpeed: 7, projectileRange: 16, projectileRadius: 0.13,
} as const
export const ENEMY_DEFINITIONS = { pursuer: PURSUER, ranged: RANGED } as const
export type EnemyKind = keyof typeof ENEMY_DEFINITIONS
export const MAX_ENEMIES = 8
export const MAX_PROJECTILES = 192
export const MAX_HOSTILE_PROJECTILES = 24
