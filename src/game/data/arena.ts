export interface Obstacle { readonly id: string; readonly minX: number; readonly maxX: number; readonly minZ: number; readonly maxZ: number }
export type EnvironmentPropKind = 'barricade' | 'fence' | 'crate' | 'barrel' | 'rock' | 'marker' | 'gatepost' | 'debris'
export interface EnvironmentProp {
  readonly id: string
  readonly kind: EnvironmentPropKind
  readonly x: number
  readonly z: number
  readonly rotation?: number
  readonly scale?: number
}

/**
 * M5 provisional combat collision. The centre preserves the former 40 x 40
 * playground; the north-east checkpoint has low cover only, leaving broad
 * routes around every piece. Fence, crate and barrel visuals are decorative.
 */
export const COMBAT_OBSTACLES: readonly Obstacle[] = [
  { id: 'cover-east', minX: 3.5, maxX: 4.3, minZ: -2.2, maxZ: 2.2 },
  { id: 'cover-north', minX: -4, maxX: 4, minZ: -15, maxZ: -14.2 },
  { id: 'cover-west', minX: -12, maxX: -11.2, minZ: -3, maxZ: 3 },
  { id: 'cover-south', minX: 7, maxX: 7.8, minZ: 9, maxZ: 15 },
  { id: 'checkpoint-barricade-west', minX: -22, maxX: -16, minZ: -12.8, maxZ: -11.7 },
  { id: 'checkpoint-barricade-east', minX: -13.5, maxX: -8.5, minZ: -12.8, maxZ: -11.7 },
  { id: 'checkpoint-barricade-north', minX: -19, maxX: -17.9, minZ: -22, maxZ: -16 },
  { id: 'yard-cover-west', minX: -45, maxX: -39, minZ: 18, maxZ: 19.1 },
  { id: 'yard-cover-east', minX: 34, maxX: 40, minZ: -30, maxZ: -28.9 },
  { id: 'yard-cover-south', minX: 24, maxX: 25.1, minZ: 25, maxZ: 31 },
]

/** Original procedural environment placement data; not Blender assets. */
export const ENVIRONMENT_PROPS: readonly EnvironmentProp[] = [
  // Near-start checkpoint: inspired by the reference's open, dusty gate area.
  { id: 'checkpoint-fence-west', kind: 'fence', x: -24.5, z: -17, rotation: 0 },
  { id: 'checkpoint-fence-west-outer', kind: 'fence', x: -30.2, z: -17, rotation: 0 },
  { id: 'checkpoint-fence-east', kind: 'fence', x: -7.5, z: -17, rotation: 0 },
  { id: 'checkpoint-fence-north', kind: 'fence', x: -13.5, z: -24.5, rotation: Math.PI / 2 },
  // Supply corner west of the route, grouped beside the west barricade.
  { id: 'checkpoint-crate-a', kind: 'crate', x: -23.5, z: -15.2, rotation: 0.35 },
  { id: 'checkpoint-crate-b', kind: 'crate', x: -21.5, z: -16.8, rotation: 0.12, scale: 0.8 },
  { id: 'checkpoint-barrel-a', kind: 'barrel', x: -24.2, z: -13.8 },
  { id: 'checkpoint-barrel-b', kind: 'barrel', x: -23.3, z: -13.2, scale: 0.85 },
  { id: 'checkpoint-marker', kind: 'marker', x: -18, z: -14.4, rotation: Math.PI / 2 },
  // Gateposts flank the inspection entrance from the south; thin, decorative,
  // and clear of the walk line so the 2.5 m gap stays open.
  { id: 'checkpoint-gatepost-west', kind: 'gatepost', x: -16.8, z: -11.2 },
  { id: 'checkpoint-gatepost-east', kind: 'gatepost', x: -12.3, z: -11.2 },
  // Low perimeter debris; decorative and kept off movement lanes.
  { id: 'checkpoint-debris-a', kind: 'debris', x: -25.5, z: -13.5, rotation: 0.5 },
  { id: 'checkpoint-debris-b', kind: 'debris', x: -9.5, z: -20.5, rotation: 2.1 },
  { id: 'checkpoint-debris-c', kind: 'debris', x: -14, z: -24.8, rotation: 1.2 },
  { id: 'checkpoint-debris-d', kind: 'debris', x: -20, z: -10.5, rotation: 2.8 },
  // Broad-map landmarks: all are intentionally non-colliding visual guidance.
  { id: 'west-rocks', kind: 'rock', x: -52, z: -20, scale: 2.2 },
  { id: 'east-crates', kind: 'crate', x: 47, z: -15, scale: 1.4 },
  { id: 'south-barrels', kind: 'barrel', x: 18, z: 38, scale: 1.25 },
  { id: 'north-marker', kind: 'marker', x: 20, z: -39 },
]
export const PURSUER = { id: 'pursuer', health: 40, speed: 1.8, radius: 0.45, damage: 10, contactInterval: 0.7 } as const
export const RANGED = {
  id: 'ranged', health: 50, speed: 1.2, radius: 0.5, damage: 15,
  warning: 0.9, recovery: 2.8, initialDelay: 1.2,
  attackRange: 10, preferredRange: 7, retreatRange: 4,
  projectileSpeed: 7, projectileRange: 16, projectileRadius: 0.13,
} as const
export const ENEMY_DEFINITIONS = { pursuer: PURSUER, ranged: RANGED } as const
export type EnemyKind = keyof typeof ENEMY_DEFINITIONS
export const MAX_ENEMIES = 20
export const MAX_PROJECTILES = 192
export const MAX_HOSTILE_PROJECTILES = 24
