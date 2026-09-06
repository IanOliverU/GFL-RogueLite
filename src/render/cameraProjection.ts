import { OrthographicCamera, Raycaster, Vector2 } from 'three'
import type { GroundPoint } from '../game/core/world'
import type { CameraPreset } from '../game/data/camera'
import { intersectGround, pointerToNdc, type CanvasBounds } from '../game/systems/targeting'

const raycaster = new Raycaster()
const ndc = new Vector2()

export function updateCamera(camera: OrthographicCamera, player: GroundPoint, width: number, height: number, preset: CameraPreset) {
  // Fixed yaw and tilt per preset; partial translation keeps movement legible.
  const x = player.x * preset.follow
  const z = player.z * preset.follow
  const vertical = Math.sin(preset.elevation) * preset.distance
  const horizontal = Math.cos(preset.elevation) * preset.distance
  camera.position.set(
    x + Math.sin(preset.yaw) * horizontal,
    vertical,
    z + Math.cos(preset.yaw) * horizontal,
  )
  camera.lookAt(x, 0, z)
  const halfHeight = preset.halfHeight
  const halfWidth = halfHeight * width / Math.max(1, height)
  camera.left = -halfWidth
  camera.right = halfWidth
  camera.top = halfHeight
  camera.bottom = -halfHeight
  camera.zoom = 1
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld(true)
}

export function projectCursor(camera: OrthographicCamera, pointer: { x: number; y: number }, rect: CanvasBounds) {
  const point = pointerToNdc(pointer.x, pointer.y, rect)
  if (!point) return null
  ndc.set(point.x, point.y)
  raycaster.setFromCamera(ndc, camera)
  return intersectGround(raycaster.ray.origin, raycaster.ray.direction)
}
