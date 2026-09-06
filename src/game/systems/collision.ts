import type { GroundPoint } from '../core/world'
import { ARENA_HALF_SIZE } from '../core/world'
import type { Obstacle } from '../data/arena'

export function segmentCircle(start: GroundPoint, end: GroundPoint, center: GroundPoint, radius: number): number | null {
  const dx = end.x - start.x, dz = end.z - start.z
  const ox = start.x - center.x, oz = start.z - center.z
  const c = ox * ox + oz * oz - radius * radius
  if (c <= 0) return 0
  const a = dx * dx + dz * dz
  if (a < 1e-12) return null
  const b = 2 * (ox * dx + oz * dz)
  const discriminant = b * b - 4 * a * c
  if (discriminant < 0) return null
  const t = (-b - Math.sqrt(discriminant)) / (2 * a)
  return t >= 0 && t <= 1 ? t : null
}

export function segmentBox(start: GroundPoint, end: GroundPoint, box: Obstacle, radius = 0): number | null {
  let near = 0, far = 1
  for (const [origin, delta, min, max] of [[start.x, end.x - start.x, box.minX - radius, box.maxX + radius], [start.z, end.z - start.z, box.minZ - radius, box.maxZ + radius]]) {
    if (Math.abs(delta) < 1e-10) { if (origin < min || origin > max) return null; continue }
    const first = (min - origin) / delta, last = (max - origin) / delta
    near = Math.max(near, Math.min(first, last))
    far = Math.min(far, Math.max(first, last))
    if (near > far) return null
  }
  return near
}

export function boundaryHit(start: GroundPoint, end: GroundPoint): number | null {
  let t = 1
  let hit = false
  for (const axis of ['x', 'z'] as const) {
    if (Math.abs(end[axis]) > ARENA_HALF_SIZE) {
      t = Math.min(t, (Math.sign(end[axis]) * ARENA_HALF_SIZE - start[axis]) / (end[axis] - start[axis]))
      hit = true
    }
  }
  return hit ? Math.max(0, t) : null
}

/** Axis-separated swept movement permits sliding, never crossing the cover or perimeter. */
export function moveCircle(position: GroundPoint, dx: number, dz: number, radius: number, obstacles: readonly Obstacle[]) {
  const limit = ARENA_HALF_SIZE - radius
  let x = Math.max(-limit, Math.min(limit, position.x + dx))
  for (const box of obstacles) {
    if (position.z > box.minZ - radius && position.z < box.maxZ + radius) {
      if (dx > 0 && position.x <= box.minX - radius && x > box.minX - radius) x = box.minX - radius
      if (dx < 0 && position.x >= box.maxX + radius && x < box.maxX + radius) x = box.maxX + radius
    }
  }
  let z = Math.max(-limit, Math.min(limit, position.z + dz))
  for (const box of obstacles) {
    if (x > box.minX - radius && x < box.maxX + radius) {
      if (dz > 0 && position.z <= box.minZ - radius && z > box.minZ - radius) z = box.minZ - radius
      if (dz < 0 && position.z >= box.maxZ + radius && z < box.maxZ + radius) z = box.maxZ + radius
    }
  }
  position.x = x
  position.z = z
}
