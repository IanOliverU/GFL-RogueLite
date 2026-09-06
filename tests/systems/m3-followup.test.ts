import { describe, expect, it } from 'vitest'
import { FIXED_STEP, Simulation } from '../../src/game/core/Simulation'
import { createWorld } from '../../src/game/core/world'
import { formatRunTime } from '../../src/ui/CombatHud'

describe('run timer', () => {
  it('formats elapsed seconds as MM:SS', () => {
    expect(formatRunTime(0)).toBe('00:00')
    expect(formatRunTime(5)).toBe('00:05')
    expect(formatRunTime(61)).toBe('01:01')
    expect(formatRunTime(599)).toBe('09:59')
    expect(formatRunTime(-3)).toBe('00:00')
  })

  it('advances during play, freezes on pause/game over, resets on restart', () => {
    const simulation = new Simulation('combat')
    simulation.startRun('sabrina')
    expect(simulation.getHud().elapsed).toBe(0)
    for (let i = 0; i < 90; i++) simulation.advance(FIXED_STEP)
    expect(simulation.world.elapsed).toBeCloseTo(1.5, 8)
    expect(simulation.getHud().elapsed).toBe(1)

    simulation.pause()
    const frozen = simulation.getHud().elapsed
    simulation.advance(10)
    expect(simulation.getHud().elapsed).toBe(frozen)
    simulation.resume()
    for (let i = 0; i < 60; i++) simulation.advance(FIXED_STEP)
    expect(simulation.getHud().elapsed).toBeGreaterThan(frozen)

    simulation.world.health = 0
    simulation.advance(FIXED_STEP)
    expect(simulation.getStatus()).toBe('game_over')
    const over = simulation.getHud().elapsed
    simulation.advance(10)
    expect(simulation.getHud().elapsed).toBe(over)

    simulation.startRun('sabrina')
    expect(simulation.world.elapsed).toBe(0)
    expect(simulation.getHud().elapsed).toBe(0)
  })
})

describe('pause-menu restart and character change', () => {
  it('restart from pause keeps the doll and clears the full run state', () => {
    const simulation = new Simulation('combat')
    simulation.startRun('vepley')
    simulation.held.add('KeyW')
    simulation.requestDash()
    for (let i = 0; i < 120; i++) simulation.advance(FIXED_STEP)
    simulation.world.hostileProjectiles.push({ id: 77, x: 0, z: -8, direction: { x: 0, z: 1 }, remaining: 10 })
    simulation.pause()
    expect(simulation.getStatus()).toBe('paused')

    simulation.startRun(simulation.world.dollId)
    expect(simulation.getStatus()).toBe('playing')
    expect(simulation.world).toEqual(createWorld('vepley', true))
    expect(simulation.held.size).toBe(0)
    expect(simulation.getHud().elapsed).toBe(0)
  })

  it('change character returns to selection for a clean run with another doll', () => {
    const simulation = new Simulation('combat')
    simulation.startRun('sabrina')
    for (let i = 0; i < 60; i++) simulation.advance(FIXED_STEP)
    simulation.pause()
    simulation.returnToSelection()
    expect(simulation.getStatus()).toBe('selection')
    simulation.startRun('tololo')
    expect(simulation.getStatus()).toBe('playing')
    expect(simulation.world).toEqual(createWorld('tololo', true))
  })

  it('resume preserves the current run without resetting progress', () => {
    const simulation = new Simulation('combat')
    simulation.startRun('sabrina')
    for (let i = 0; i < 60; i++) simulation.advance(FIXED_STEP)
    const elapsed = simulation.world.elapsed
    simulation.pause()
    simulation.resume()
    expect(simulation.getStatus()).toBe('playing')
    expect(simulation.world.elapsed).toBe(elapsed)
    simulation.advance(FIXED_STEP)
    expect(simulation.world.elapsed).toBeGreaterThan(elapsed)
  })
})
