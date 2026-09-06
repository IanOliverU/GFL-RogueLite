import { movePlayer } from '../systems/movement'
import { createWorld } from './world'

export const FIXED_STEP = 1 / 60
const MAX_STEPS = 6
export type RunStatus = 'playing' | 'paused'
export type PauseReason = 'manual' | 'focus' | 'graphics'

/** Owns gameplay state; no browser, React or Three.js dependencies. */
export class Simulation {
  readonly world = createWorld()
  readonly held = new Set<string>()
  pointer: { x: number; y: number } | null = null
  private accumulator = 0
  private status: RunStatus = 'playing'
  pauseReason: PauseReason = 'manual'
  private readonly listeners = new Set<() => void>()

  getStatus = (): RunStatus => this.status
  getPauseReason = (): PauseReason => this.pauseReason
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  clearInput(): void {
    this.held.clear()
    this.pointer = null
  }

  pause(reason: PauseReason = 'manual'): void {
    this.clearInput()
    this.accumulator = 0
    if (!(reason === 'focus' && this.pauseReason === 'graphics')) this.pauseReason = reason
    this.status = 'paused'
    this.listeners.forEach((listener) => listener())
  }

  resume(): void {
    if (this.pauseReason === 'graphics') return
    this.clearInput()
    this.accumulator = 0
    this.status = 'playing'
    this.listeners.forEach((listener) => listener())
  }

  advance(delta: number): void {
    if (this.status !== 'playing') { this.accumulator = 0; return }
    if (!Number.isFinite(delta) || delta < 0) return
    this.accumulator += Math.min(delta, FIXED_STEP * MAX_STEPS)
    let steps = 0
    while (this.accumulator + 1e-10 >= FIXED_STEP && steps < MAX_STEPS) {
      movePlayer(this.world.player, this.held, FIXED_STEP)
      this.world.elapsed += FIXED_STEP
      this.accumulator = Math.max(0, this.accumulator - FIXED_STEP)
      steps++
    }
  }
}
