import { OrthographicCamera, Raycaster, Vector2 } from 'three'
import type { GroundPoint } from '../game/core/world'
import { intersectGround, pointerToNdc, type CanvasBounds } from '../game/systems/targeting'

const raycaster = new Raycaster()
const ndc = new Vector2()

export function updateCamera(camera: OrthographicCamera, player: GroundPoint, width: number, height: number) {
  // Fixed yaw and tilt; partial translation keeps movement legible on screen.
  const x = player.x * 0.45
  const z = player.z * 0.45
  camera.position.set(x, 22, z + 18)
  camera.lookAt(x, 0, z)
  const halfHeight = 14
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
