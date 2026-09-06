import { describe, expect, it } from 'vitest'
import { FIXED_STEP, Simulation } from '../../src/game/core/Simulation'

describe('simulation lifecycle', () => {
  it('moves the same distance at 30, 60 and 144 render frames per second', () => {
    for (const fps of [30, 60, 144]) {
      const simulation = new Simulation()
      simulation.held.add('KeyD')
      for (let frame = 0; frame < fps; frame++) simulation.advance(1 / fps)
      expect(simulation.world.player.x).toBeCloseTo(6, 8)
    }
  })
  it('clears inputs and accumulated time across pause and deliberate resume', () => {
    const simulation = new Simulation()
    simulation.held.add('KeyD')
    simulation.pointer = { x: 20, y: 30 }
    simulation.advance(FIXED_STEP / 2)
    simulation.pause('focus')
    simulation.advance(100)
    expect(simulation.world.elapsed).toBe(0)
    expect(simulation.held.size).toBe(0)
    expect(simulation.pointer).toBeNull()
    simulation.resume()
    simulation.advance(FIXED_STEP / 2)
    expect(simulation.world.elapsed).toBe(0)
    simulation.advance(FIXED_STEP)
    expect(simulation.world.player.x).toBe(0)
  })
  it('bounds catch-up after a long frame and rejects invalid deltas', () => {
    const simulation = new Simulation()
    simulation.advance(120)
    expect(simulation.world.elapsed).toBeCloseTo(0.1)
    simulation.advance(0)
    simulation.advance(Number.NaN)
    simulation.advance(-1)
    expect(simulation.world.elapsed).toBeCloseTo(0.1)
  })
  it('notifies only lifecycle changes and cleans up subscribers', () => {
    const simulation = new Simulation()
    let calls = 0
    const unsubscribe = simulation.subscribe(() => calls++)
    simulation.advance(1 / 60)
    simulation.pause()
    simulation.resume()
    expect(calls).toBe(2)
    unsubscribe()
    simulation.pause()
    expect(calls).toBe(2)
  })
  it('keeps graphics loss paused through focus changes until recovery', () => {
    const simulation = new Simulation()
    simulation.pause('graphics')
    simulation.pause('focus')
    simulation.resume()
    expect(simulation.getStatus()).toBe('paused')
    expect(simulation.getPauseReason()).toBe('graphics')
    simulation.pause('manual') // Browser context-restored event.
    simulation.resume()
    expect(simulation.getStatus()).toBe('playing')
  })
})
