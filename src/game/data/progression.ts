/**
 * Provisional M4 progression tuning. All values are prototype fan-game
 * adaptations, not verified official GFL2 abilities or balance.
 */

/** XP value of each enemy's single drop, awarded exactly once on death. */
export const XP_DROP = { pursuer: 2, ranged: 4 } as const

/** XP needed to advance from `level` to `level + 1`. Steepened for the denser pacing so levels land ~30-45 s apart instead of interrupting constantly. */
export function xpForLevel(level: number): number {
  return 5 + (level - 1) * 3
}
export const MAX_LEVEL = 20

/** Gun ranks: rank 1 is the M2 base weapon; each further rank adds damage. */
export const GUN_MAX_RANK = 5
export const GUN_DAMAGE_PER_RANK = 0.15

export interface EquipmentDefinition {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly maxRank: number
}

export const EQUIPMENT = {
  'plated-vest': {
    id: 'plated-vest', name: 'Plated Vest', maxRank: 3,
    description: '+25 max HP per rank and restores 25 HP now. Required for the Shockwave Barrage evolution.',
  },
  'drum-magazine': {
    id: 'drum-magazine', name: 'Drum Magazine', maxRank: 3,
    description: '+30% magazine size per rank. Applies to the next reload without touching loaded ammo.',
  },
  'trigger-unit': {
    id: 'trigger-unit', name: 'Trigger Unit', maxRank: 3,
    description: 'Fire interval x0.88 per rank. Burst spacing is unchanged.',
  },
} as const satisfies Record<string, EquipmentDefinition>

export type EquipmentId = keyof typeof EQUIPMENT
export const EQUIPMENT_LIST = Object.values(EQUIPMENT)
/** At most this many distinct equipment items per run. */
export const MAX_EQUIPMENT_SLOTS = 3

/**
 * The one M4 evolution (Sabrina only): every 4th volley is empowered —
 * double damage, double knockback and +4 pellets.
 */
export const EVOLUTION = {
  id: 'shockwave-barrage',
  name: 'Shockwave Barrage',
  dollId: 'sabrina',
  requiresGunRank: GUN_MAX_RANK,
  requiresEquipment: { id: 'plated-vest', rank: 3 } as const,
  description: 'Sabrina only. Every 4th shotgun volley is empowered: double damage, double knockback, +4 pellets.',
} as const

/** Sabrina's automatic skill: a periodic close-range knockback pulse. */
export const PULSE_SKILL = {
  interval: 6, radius: 4, damage: 8, knockback: 6,
  description: "Sabrina's automatic knockback pulse hits nearby enemies every 6 seconds.",
} as const

/** Fallback choice keeps the run moving when nothing else is eligible. */
export const FALLBACK_HEAL = 30

export const GEM_MAGNET_RADIUS = 3
export const GEM_PICKUP_RADIUS = 1
export const GEM_MAGNET_SPEED = 4
export const MAX_GEMS = 64

export type ChoiceKind = 'gun' | 'equipment' | 'evolution' | 'fallback'
export interface UpgradeChoice {
  readonly kind: ChoiceKind
  /** Equipment id for equipment choices; undefined otherwise. */
  readonly id?: string
  readonly title: string
  /** e.g. "Rank 2 -> 3". Empty for the fallback. */
  readonly rankLabel: string
  readonly description: string
}
