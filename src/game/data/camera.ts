/**
 * Camera presets for the M5 framing experiment. Plain data plus a tiny
 * store; rendering maps a preset onto the three.js camera, while gameplay
 * systems only ever consume the yaw for screen-relative movement.
 *
 * Classic preserves the long-standing M1 framing exactly. Angled rotates the
 * view for the isometric-style evaluation. Neither preset changes the map,
 * the simulation, or the aiming math (cursor rays always hit the ground).
 */

export type CameraPresetId = 'classic' | 'angled'

export interface CameraPreset {
  readonly id: CameraPresetId
  readonly label: string
  /** Horizontal rotation about Y, radians. 0 looks north (-Z). */
  readonly yaw: number
  /** Elevation above the ground plane, radians. */
  readonly elevation: number
  /** Camera distance from the look target, metres. */
  readonly distance: number
  /** Orthographic half-height, metres (controls framing closeness). */
  readonly halfHeight: number
  /** Fraction of the player position the camera follows. */
  readonly follow: number
}

export const CAMERA_PRESETS: Record<CameraPresetId, CameraPreset> = {
  classic: {
    id: 'classic',
    label: 'Classic',
    yaw: 0,
    // Matches the historical framing: height 22 at depth 18.
    elevation: Math.atan2(22, 18),
    distance: Math.hypot(22, 18),
    halfHeight: 14,
    follow: 0.45,
  },
  angled: {
    id: 'angled',
    label: 'Angled',
    yaw: Math.PI / 4,
    elevation: (40 * Math.PI) / 180,
    distance: Math.hypot(22, 18),
    halfHeight: 10,
    follow: 0.45,
  },
}

/** Experiment default. Change back to 'classic' to restore the old framing. */
export const DEFAULT_CAMERA_PRESET: CameraPresetId = 'angled'

let current: CameraPresetId = DEFAULT_CAMERA_PRESET
const listeners = new Set<() => void>()

export function getCameraPreset(): CameraPreset {
  return CAMERA_PRESETS[current]
}

export function getCameraPresetId(): CameraPresetId {
  return current
}

export function setCameraPreset(id: CameraPresetId): void {
  if (CAMERA_PRESETS[id] && id !== current) {
    current = id
    listeners.forEach((listener) => listener())
  }
}

/** Reset to the experiment default (used by tests). */
export function resetCameraPreset(): void {
  current = DEFAULT_CAMERA_PRESET
  listeners.forEach((listener) => listener())
}

export function subscribeCameraPreset(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

/**
 * Screen basis on the ground plane for a camera yaw. Screen-up points away
 * from the viewer (W), screen-right follows (D); both normalized.
 */
export function screenBasis(yaw: number): { up: { x: number; z: number }; right: { x: number; z: number } } {
  return {
    up: { x: -Math.sin(yaw), z: -Math.cos(yaw) },
    right: { x: Math.cos(yaw), z: -Math.sin(yaw) },
  }
}
