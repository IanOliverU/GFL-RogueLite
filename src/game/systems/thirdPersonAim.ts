import type { GroundPoint, World } from '../core/world'
import { boundaryHit, segmentBox } from './collision'

/**
 * Third-person aim resolution (development-only `?mode=thirdperson`).
 *
 * The renderer casts the camera-center ray onto the ground plane; this
 * resolves that raw target against the AUTHORITATIVE player-origin model:
 * out-of-bounds targets clamp to the map edge and targets behind cover clamp
 * to the first blocking surface along the muzzle path, so the character can
 * never shoot through nearby cover just because the camera sees beyond it.
 * Direction is unchanged by clamping; projectiles still spawn at the player
 * and collide through the shared swept system, so visuals and hits agree.
 */
export function resolveThirdPersonTarget(world: World, target: GroundPoint | null): GroundPoint | null {
  if (!target || !Number.isFinite(target.x) || !Number.isFinite(target.z)) return null
  const start = world.player
  let end = { x: target.x, z: target.z }
  const edge = boundaryHit(start, end)
  if (edge !== null && edge < 1) {
    end = { x: start.x + (end.x - start.x) * edge, z: start.z + (end.z - start.z) * edge }
  }
  let wall = Infinity
  for (const obstacle of world.obstacles) {
    wall = Math.min(wall, segmentBox(start, end, obstacle, 0.05) ?? Infinity)
  }
  if (wall < 1) {
    const safe = Math.max(0, wall - 1e-4)
    end = { x: start.x + (end.x - start.x) * safe, z: start.z + (end.z - start.z) * safe }
  }
  return end
}
