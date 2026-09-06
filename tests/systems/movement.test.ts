import { describe, expect, it } from 'vitest'
import { movePlayer } from '../../src/game/systems/movement'

describe('movement', () => {
  it('travels equal distances for cardinal and diagonal movement', () => {
    const straight = { x: 0, z: 0 }
    const diagonal = { x: 0, z: 0 }
    for (let i = 0; i < 60; i++) {
      movePlayer(straight, new Set(['KeyW']), 1 / 60)
      movePlayer(diagonal, new Set(['KeyW', 'KeyD']), 1 / 60)
    }
    expect(Math.hypot(diagonal.x, diagonal.z)).toBeCloseTo(Math.hypot(straight.x, straight.z), 10)
    expect(straight.z).toBeCloseTo(-6)
  })
  it('cancels opposite inputs', () => {
    const player = { x: 2, z: 3 }
    movePlayer(player, new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD']), 1)
    expect(player).toEqual({ x: 2, z: 3 })
  })
  it('keeps the entire collision circle inside every edge and allows sliding', () => {
    const player = { x: 0, z: 0 }
    movePlayer(player, new Set(['KeyD', 'KeyS']), 100)
    expect(player).toEqual({ x: 11.6, z: 11.6 })
    movePlayer(player, new Set(['KeyD', 'KeyW']), 0.5)
    expect(player.x).toBe(11.6)
    expect(player.z).toBeLessThan(11.6)
    movePlayer(player, new Set(['KeyA', 'KeyW']), 100)
    expect(player).toEqual({ x: -11.6, z: -11.6 })
  })
})
