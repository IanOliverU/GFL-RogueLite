import type { GroundPoint, World } from '../core/world'

interface Point3 { x: number; y: number; z: number }
export interface CanvasBounds { left: number; top: number; width: number; height: number }

export function pointerToNdc(x: number, y: number, rect: CanvasBounds) {
  if (rect.width <= 0 || rect.height <= 0) return null
  return { x: (x - rect.left) / rect.width * 2 - 1, y: 1 - (y - rect.top) / rect.height * 2 }
}

export function intersectGround(origin: Point3, direction: Point3): GroundPoint | null {
  if (Math.abs(direction.y) < 1e-8) return null
  const distance = -origin.y / direction.y
  if (distance < 0 || !Number.isFinite(distance)) return null
  const x = origin.x + direction.x * distance
  const z = origin.z + direction.z * distance
  return Number.isFinite(x) && Number.isFinite(z) ? { x, z } : null
}

export function updateAim(world: World, target: GroundPoint | null): void {
  if (!target || !Number.isFinite(target.x) || !Number.isFinite(target.z)) return
  world.aimTarget = target
  const dx = target.x - world.player.x
  const dz = target.z - world.player.z
  const length = Math.hypot(dx, dz)
  if (length > 1e-6) {
    world.aimDirection.x = dx / length
    world.aimDirection.z = dz / length
  }
}
