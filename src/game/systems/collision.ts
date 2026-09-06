import type { GroundPoint } from '../core/world'
import { MAP_HALF_DEPTH, MAP_HALF_WIDTH } from '../core/world'
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
  for (const [axis, limit] of [['x', MAP_HALF_WIDTH], ['z', MAP_HALF_DEPTH]] as const) {
    if (Math.abs(end[axis]) > limit) {
      t = Math.min(t, (Math.sign(end[axis]) * limit - start[axis]) / (end[axis] - start[axis]))
      hit = true
    }
  }
  return hit ? Math.max(0, t) : null
}

/** Axis-separated swept movement permits sliding, never crossing the cover or perimeter. */
export function moveCircle(position: GroundPoint, dx: number, dz: number, radius: number, obstacles: readonly Obstacle[]) {
  const xLimit = MAP_HALF_WIDTH - radius, zLimit = MAP_HALF_DEPTH - radius
  let x = Math.max(-xLimit, Math.min(xLimit, position.x + dx))
  for (const box of obstacles) {
    if (position.z > box.minZ - radius && position.z < box.maxZ + radius) {
      if (dx > 0 && position.x <= box.minX - radius && x > box.minX - radius) x = box.minX - radius
      if (dx < 0 && position.x >= box.maxX + radius && x < box.maxX + radius) x = box.maxX + radius
    }
  }
  let z = Math.max(-zLimit, Math.min(zLimit, position.z + dz))
  for (const box of obstacles) {
    if (x > box.minX - radius && x < box.maxX + radius) {
      if (dz > 0 && position.z <= box.minZ - radius && z > box.minZ - radius) z = box.minZ - radius
      if (dz < 0 && position.z >= box.maxZ + radius && z < box.maxZ + radius) z = box.maxZ + radius
    }
  }
  position.x = x
  position.z = z
}

/** Dash follows a straight swept path, stopping at first cover/perimeter contact. */
export function moveCircleSwept(position: GroundPoint, dx: number, dz: number, radius: number, obstacles: readonly Obstacle[]) {
  const end = { x: position.x + dx, z: position.z + dz }
  let fraction = 1
  for (const [axis, limit] of [['x', MAP_HALF_WIDTH - radius], ['z', MAP_HALF_DEPTH - radius]] as const) {
    if (Math.abs(end[axis]) > limit) fraction = Math.min(fraction, (Math.sign(end[axis]) * limit - position[axis]) / (end[axis] - position[axis]))
  }
  for (const box of obstacles) {
    // Touching a face permits moving away or along it, but never into it.
    if ((position.x <= box.minX - radius && dx <= 0) || (position.x >= box.maxX + radius && dx >= 0) ||
        (position.z <= box.minZ - radius && dz <= 0) || (position.z >= box.maxZ + radius && dz >= 0)) continue
    fraction = Math.min(fraction, segmentBox(position, end, box, radius) ?? 1)
  }
  const safe = Math.max(0, fraction - (fraction < 1 ? 1e-8 : 0))
  position.x += dx * safe
  position.z += dz * safe
}
