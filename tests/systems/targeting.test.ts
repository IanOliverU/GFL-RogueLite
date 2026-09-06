import { describe, expect, it } from 'vitest'
import { OrthographicCamera, Vector3 } from 'three'
import { createWorld } from '../../src/game/core/world'
import { intersectGround, pointerToNdc, updateAim } from '../../src/game/systems/targeting'
import { projectCursor, updateCamera } from '../../src/render/cameraProjection'

describe('floor targeting', () => {
  it('uses canvas-relative coordinates including nonzero offsets', () => {
    expect(pointerToNdc(300, 250, { left: 100, top: 50, width: 400, height: 400 })).toEqual({ x: 0, y: 0 })
    expect(pointerToNdc(0, 0, { left: 0, top: 0, width: 0, height: 20 })).toBeNull()
  })
  it('rejects parallel, behind-camera, and invalid intersections', () => {
    expect(intersectGround({ x: 0, y: 2, z: 0 }, { x: 1, y: 0, z: 0 })).toBeNull()
    expect(intersectGround({ x: 0, y: 2, z: 0 }, { x: 0, y: 1, z: 0 })).toBeNull()
    expect(intersectGround({ x: 0, y: 2, z: 0 }, { x: NaN, y: -1, z: 0 })).toBeNull()
  })
  it('retains the last direction at the feet or with no valid target', () => {
    const world = createWorld()
    updateAim(world, { x: 2, z: 0 })
    updateAim(world, { x: 0, z: 0 })
    updateAim(world, null)
    expect(world.aimDirection).toEqual({ x: 1, z: 0 })
  })
  it('round-trips floor targets in every quadrant after camera translation and resize', () => {
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 250)
    for (const size of [{ width: 1280, height: 639 }, { width: 710, height: 760 }]) {
      const rect = { left: 37, top: 94, ...size }
      for (const player of [{ x: 0, z: 0 }, { x: 7, z: -8 }]) {
        updateCamera(camera, player, rect.width, rect.height)
        for (const x of [-5, 5]) for (const z of [-5, 5]) {
          const screen = new Vector3(x, 0, z).project(camera)
          const target = projectCursor(camera, { x: rect.left + (screen.x + 1) * rect.width / 2, y: rect.top + (1 - screen.y) * rect.height / 2 }, rect)
          expect(target?.x).toBeCloseTo(x, 8)
          expect(target?.z).toBeCloseTo(z, 8)
        }
      }
    }
  })
  it('reprojects a stationary pointer after camera follow', () => {
    const camera = new OrthographicCamera()
    const rect = { left: 0, top: 94, width: 1280, height: 639 }
    const pointer = { x: 700, y: 350 }
    updateCamera(camera, { x: 0, z: 0 }, rect.width, rect.height)
    const before = projectCursor(camera, pointer, rect)!
    updateCamera(camera, { x: 6, z: 0 }, rect.width, rect.height)
    const after = projectCursor(camera, pointer, rect)!
    expect(after.x - before.x).toBeCloseTo(2.7)
    expect(after.z).toBeCloseTo(before.z)
  })
})
