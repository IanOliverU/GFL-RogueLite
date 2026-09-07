import { segmentBox } from '../systems/collision'
import type { GroundPoint } from '../core/world'
import type { CharacterId } from './characters'
import type { Obstacle } from './arena'

/** Modeled dolls playable in the third-person experiment (skinned GLBs). */
export const THIRDPERSON_DOLL_IDS: readonly CharacterId[] = ['sabrina', 'mosin-nagant', 'qiongjiu']

/**
 * Third-person experiment tuning (development-only `?mode=thirdperson`).
 * Camera sits behind and above Sabrina; mouse orbit controls yaw/pitch.
 * Movement and dash reuse the shared screen-relative basis, so the orbit yaw
 * is the only coupling between camera and gameplay.
 */
export const THIRD_PERSON = {
  /** Desired camera distance behind the target, metres. */
  distance: 6,
  /** Starting downward pitch, degrees. */
  startPitchDegrees: 18,
  /** Pitch clamp keeps the ray ground-bound and never inverted, degrees. */
  minPitchDegrees: 4,
  maxPitchDegrees: 58,
  /** Aim/camera target height above the feet anchor (chest), metres. */
  targetHeight: 1.6,
  /** Orbit radians per pointer-lock pixel. */
  sensitivity: 0.0026,
  /** Exponential follow sharpness (1/s); no laggy spring, no shake. */
  followSharpness: 12,
  /** Camera collision margin around solid footprints, metres. */
  radius: 0.35,
  /** Distant aim fallback along camera forward, metres. */
  maxAimDistance: 30,
} as const

export function clampPitch(pitchRadians: number): number {
  const min = (THIRD_PERSON.minPitchDegrees * Math.PI) / 180
  const max = (THIRD_PERSON.maxPitchDegrees * Math.PI) / 180
  return Math.min(max, Math.max(min, pitchRadians))
}

/** Camera position relative to the target for an orbit yaw/pitch/distance. */
export function orbitOffset(yawRadians: number, pitchRadians: number, distance: number): { x: number; y: number; z: number } {
  const level = Math.cos(pitchRadians) * distance
  return {
    x: Math.sin(yawRadians) * level,
    y: Math.sin(pitchRadians) * distance,
    z: Math.cos(yawRadians) * level,
  }
}

/**
 * Ground-plane facing for an orbit yaw. Identical to the shared screen-basis
 * "up" (W direction), so movement/dash stay consistent with the camera.
 */
export function orbitForward(yawRadians: number): GroundPoint {
  return { x: -Math.sin(yawRadians), z: -Math.cos(yawRadians) }
}

/** Frame-rate independent follow factor for exponential smoothing. */
export function followFactor(dtSeconds: number): number {
  if (!Number.isFinite(dtSeconds) || dtSeconds <= 0) return 1
  return 1 - Math.exp(-THIRD_PERSON.followSharpness * dtSeconds)
}

export interface CameraSample { x: number; y: number; z: number }

/**
 * Pull the camera in front of solid scenery. Samples the target-to-desired
 * segment against expanded obstacle footprints: where the ray would pass
 * below a solid top (plus margin), the camera stops just before entry.
 * Pure and deterministic; smoothing/recovery live in the renderer.
 */
export function collideCamera(
  target: CameraSample,
  desired: CameraSample,
  obstacles: readonly Obstacle[],
  heights: Readonly<Record<string, number>>,
  radius: number = THIRD_PERSON.radius,
): CameraSample {
  const start = { x: target.x, z: target.z }
  const end = { x: desired.x, z: desired.z }
  let fraction = 1
  for (const box of obstacles) {
    const height = heights[box.id] ?? 0
    const enter = segmentBox(start, end, box, radius)
    if (enter === null || enter >= 1) continue
    // Camera height along the ray at entry; only tall-enough solids occlude.
    const yAtEnter = target.y + (desired.y - target.y) * enter
    if (yAtEnter < height + radius) fraction = Math.min(fraction, enter)
  }
  if (fraction >= 1) return desired
  const safe = Math.max(0, fraction - 1e-3)
  return {
    x: target.x + (desired.x - target.x) * safe,
    y: Math.max(0.5, target.y + (desired.y - target.y) * safe),
    z: target.z + (desired.z - target.z) * safe,
  }
}
