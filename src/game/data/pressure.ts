export const PRESSURE_PHASES = [
  { start: 0, interval: 3.5, maxAlive: 4, maxRanged: 1 },
  { start: 15, interval: 3, maxAlive: 6, maxRanged: 2 },
  { start: 40, interval: 2.6, maxAlive: 8, maxRanged: 2 },
] as const
export const FIRST_SPAWN_DELAY = 4
export const MIN_SPAWN_DISTANCE = 6
export const SPAWN_POINTS = [{ x: 0, z: -9 }, { x: 8, z: 8 }, { x: -8, z: 8 }, { x: 8, z: -8 }, { x: -8, z: -8 }, { x: 0, z: 9 }] as const
export function pressureAt(elapsed: number) {
  for (let i = PRESSURE_PHASES.length - 1; i >= 0; i--) if (elapsed >= PRESSURE_PHASES[i].start) return PRESSURE_PHASES[i]
  return PRESSURE_PHASES[0]
}
