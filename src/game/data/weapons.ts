export interface WeaponDefinition {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly damage: number
  readonly pellets: number
  readonly spreadDegrees: number
  readonly range: number
  readonly projectileSpeed: number
  readonly interval: number
  readonly burstSize: number
  readonly burstInterval: number
  readonly magazine: number
  readonly reload: number
  readonly maxHits: number
  readonly knockback: number
}

// Prototype fan-game adaptations. Values do not represent verified official kits.
export const WEAPONS = {
  'broad-shotgun': { id: 'broad-shotgun', name: 'Broad shotgun', description: 'Close-range, seven-pellet volleys with a broad spread.', damage: 12, pellets: 7, spreadDegrees: 50, range: 6, projectileSpeed: 26, interval: 0.8, burstSize: 1, burstInterval: 0, magazine: 6, reload: 1.8, maxHits: 1, knockback: 2 },
  'burst-rifle': { id: 'burst-rifle', name: 'Burst rifle', description: 'Controlled three-round assault-rifle bursts.', damage: 16, pellets: 1, spreadDegrees: 0, range: 11, projectileSpeed: 40, interval: 0.55, burstSize: 3, burstInterval: 0.1, magazine: 18, reload: 1.6, maxHits: 1, knockback: 1 },
  'rapid-rifle': { id: 'rapid-rifle', name: 'Rapid rifle', description: 'Fast, sustained assault-rifle fire.', damage: 11, pellets: 1, spreadDegrees: 0, range: 10, projectileSpeed: 38, interval: 0.13, burstSize: 1, burstInterval: 0, magazine: 24, reload: 1.5, maxHits: 1, knockback: 0.8 },
  'piercing-sniper': { id: 'piercing-sniper', name: 'Piercing sniper', description: 'Slow, powerful shots that pierce up to three enemies.', damage: 70, pellets: 1, spreadDegrees: 0, range: 22, projectileSpeed: 90, interval: 1.2, burstSize: 1, burstInterval: 0, magazine: 5, reload: 2.2, maxHits: 3, knockback: 3 },
  'machine-gun': { id: 'machine-gun', name: 'Machine gun', description: 'Sustained fire, a 60-round magazine and a long reload.', damage: 9, pellets: 1, spreadDegrees: 0, range: 12, projectileSpeed: 38, interval: 0.09, burstSize: 1, burstInterval: 0, magazine: 60, reload: 3.2, maxHits: 1, knockback: 0.7 },
  'light-shotgun': { id: 'light-shotgun', name: 'Light shotgun', description: 'Fast, lighter five-pellet volleys with strong knockback.', damage: 7, pellets: 5, spreadDegrees: 36, range: 6.5, projectileSpeed: 28, interval: 0.42, burstSize: 1, burstInterval: 0, magazine: 8, reload: 1.6, maxHits: 1, knockback: 12 },
} as const satisfies Record<string, WeaponDefinition>

export type WeaponId = keyof typeof WEAPONS
