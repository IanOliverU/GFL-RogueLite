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
export const MIN_SPAWN_DISTANCE = 8
/** Points preferring this distance are treated as out of the camera view. */
export const FAR_SPAWN_DISTANCE = 16
export const SPAWN_POINTS = [
  { x: 0, z: -17 }, { x: 14, z: 12 }, { x: -14, z: 12 }, { x: 14, z: -12 },
  { x: -14, z: -12 }, { x: 0, z: 17 }, { x: 17, z: 0 }, { x: -17, z: 0 },
] as const
export function pressureAt(elapsed: number) {
  for (let i = PRESSURE_PHASES.length - 1; i >= 0; i--) if (elapsed >= PRESSURE_PHASES[i].start) return PRESSURE_PHASES[i]
  return PRESSURE_PHASES[0]
}
