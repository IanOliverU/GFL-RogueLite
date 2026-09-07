/**
 * Provisional survival pacing for the 40 x 40 arena, tuned alongside M4
 * upgrades: pursuers carry the crowd density while ranged attackers stay
 * capped so warnings remain readable.
 */
export const PRESSURE_PHASES = [
  { start: 0, interval: 3.0, maxAlive: 6, maxRanged: 1 },
  { start: 20, interval: 2.4, maxAlive: 10, maxRanged: 2 },
  { start: 60, interval: 2.0, maxAlive: 14, maxRanged: 2 },
  { start: 120, interval: 1.6, maxAlive: 18, maxRanged: 2 },
] as const
export const FIRST_SPAWN_DELAY = 4
export const MIN_SPAWN_DISTANCE = 12
/** Points preferring this distance are treated as out of the camera view. */
export const FAR_SPAWN_DISTANCE = 22
export interface SpawnPoint { readonly x: number; readonly z: number }
export const SPAWN_POINTS: readonly SpawnPoint[] = [
  { x: -54, z: -38 }, { x: -30, z: -38 }, { x: 0, z: -38 }, { x: 30, z: -38 }, { x: 54, z: -38 },
  { x: -54, z: -12 }, { x: 54, z: -12 }, { x: -54, z: 12 }, { x: 54, z: 12 },
  { x: -54, z: 38 }, { x: -30, z: 38 }, { x: 0, z: 38 }, { x: 30, z: 38 }, { x: 54, z: 38 },
  { x: -30, z: -24 }, { x: 0, z: -24 }, { x: 30, z: -24 }, { x: -30, z: 24 }, { x: 0, z: 24 }, { x: 30, z: 24 },
]

/**
 * Third-person test-arena spawn ring (experimental). Same pressure tuning and
 * exclusion rules; points sit inside the walled enclosure, clear of covers,
 * so pursuers stay reachable without crossing the whole 120 x 96 map.
 */
export const THIRDPERSON_SPAWN_POINTS: readonly SpawnPoint[] = [
  { x: -14, z: -12 }, { x: 0, z: -13 }, { x: 14, z: -12 },
  { x: 14, z: 0 }, { x: 14, z: 12 }, { x: 0, z: 13 },
  { x: -14, z: 12 }, { x: -14, z: 0 }, { x: -8, z: -13 }, { x: 8, z: -13 },
  { x: -8, z: 13 }, { x: 8, z: 13 },
]
export function pressureAt(elapsed: number) {
  for (let i = PRESSURE_PHASES.length - 1; i >= 0; i--) if (elapsed >= PRESSURE_PHASES[i].start) return PRESSURE_PHASES[i]
  return PRESSURE_PHASES[0]
}
