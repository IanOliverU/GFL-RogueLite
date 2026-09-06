import { movePlayer } from '../systems/movement'
import { createWorld, type GroundPoint } from './world'
import type { CharacterId } from '../data/characters'
import { updateAim } from '../systems/targeting'
import { stepWeapon } from '../systems/weapons'
import { stepProjectiles } from '../systems/projectiles'
import { stepEnemies } from '../systems/enemies'
import { finishDashStep, stepDash } from '../systems/dash'
import { stepRangedAttacks } from '../systems/rangedAttacks'
import { stepEnemyProjectiles } from '../systems/enemyProjectiles'

export const FIXED_STEP = 1 / 60
const MAX_STEPS = 6
export type RunStatus = 'selection' | 'playing' | 'paused' | 'game_over'
export type PauseReason = 'manual' | 'focus' | 'graphics'

/** Owns gameplay state; no browser, React or Three.js dependencies. */
export class Simulation {
  world = createWorld()
  readonly held = new Set<string>()
  pointer: { x: number; y: number } | null = null
  private accumulator = 0
  private status: RunStatus = 'playing'
  pauseReason: PauseReason = 'manual'
  private readonly listeners = new Set<() => void>()
  private hud = { health: 100, ammo: 6, reloading: false, kills: 0, shots: 0, dashCooldown: 0, dashing: false, elapsed: 0 }
  private dashRequested = false
  private clampResumeDelta = false

  constructor(mode: 'playground' | 'combat' = 'playground') {
    if (mode === 'combat') this.status = 'selection'
  }

  getHud = () => this.hud
  private publishHud() {
    const world = this.world
    const next = { health: world.health, ammo: world.weapon.ammo, reloading: world.weapon.reloadRemaining > 0, kills: world.kills, shots: world.shots, dashCooldown: Math.ceil(world.dash.cooldown * 10) / 10, dashing: world.dash.remaining > 0, elapsed: Math.floor(world.elapsed) }
    if (JSON.stringify(next) !== JSON.stringify(this.hud)) {
      this.hud = next
      this.listeners.forEach((listener) => listener())
    }
  }

  startRun(dollId: CharacterId): void {
    this.world = createWorld(dollId, true)
    this.clearInput()
    this.accumulator = 0
    this.clampResumeDelta = false
    this.pauseReason = 'manual'
    this.status = 'playing'
    this.publishHud()
    this.listeners.forEach((listener) => listener())
  }

  returnToSelection(): void {
    this.world = createWorld(this.world.dollId)
    this.clearInput()
    this.accumulator = 0
    this.clampResumeDelta = false
    this.pauseReason = 'manual'
    this.status = 'selection'
    this.publishHud()
    this.listeners.forEach((listener) => listener())
  }

  getStatus = (): RunStatus => this.status
  getPauseReason = (): PauseReason => this.pauseReason
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  clearInput(): void {
    this.held.clear()
    this.pointer = null
    this.dashRequested = false
  }

  requestDash(): boolean {
    if (this.status !== 'playing' || !this.world.combat || this.world.dash.cooldown > 1e-8 || this.world.dash.remaining > 0) return false
    this.dashRequested = true
    return true
  }

  pause(reason: PauseReason = 'manual'): void {
    if (this.status !== 'playing' && this.status !== 'paused') { this.clearInput(); return }
    this.clearInput()
    this.accumulator = 0
    if (!(reason === 'focus' && this.pauseReason === 'graphics')) this.pauseReason = reason
    this.status = 'paused'
    this.listeners.forEach((listener) => listener())
  }

  resume(): void {
    if (this.status !== 'paused' || this.pauseReason === 'graphics') return
    this.clearInput()
    this.accumulator = 0
    this.clampResumeDelta = true
    this.status = 'playing'
    this.listeners.forEach((listener) => listener())
  }

  advance(delta: number, sampleAim?: (player: GroundPoint) => GroundPoint | null): void {
    if (this.status !== 'playing') { this.accumulator = 0; return }
    if (!Number.isFinite(delta) || delta < 0) return
    if (this.clampResumeDelta) { delta = Math.min(delta, FIXED_STEP); this.clampResumeDelta = false }
    this.accumulator += Math.min(delta, FIXED_STEP * MAX_STEPS)
    let steps = 0
    while (this.accumulator + 1e-10 >= FIXED_STEP && steps < MAX_STEPS) {
      const playerStart = { ...this.world.player }
      if (this.dashRequested && sampleAim && this.pointer) updateAim(this.world, sampleAim(this.world.player))
      const dashing = this.world.combat && stepDash(this.world, this.held, this.dashRequested, FIXED_STEP)
      this.dashRequested = false
      if (!dashing) movePlayer(this.world.player, this.held, FIXED_STEP, this.world.obstacles)
      // Renderer supplies projection only; simulation owns direction and firing order.
      if (sampleAim && this.pointer) updateAim(this.world, sampleAim(this.world.player))
      if (this.world.combat) {
        stepEnemies(this.world, FIXED_STEP)
        if (this.world.health > 0) {
          stepWeapon(this.world, FIXED_STEP, this.pointer !== null)
          stepProjectiles(this.world, FIXED_STEP)
          stepRangedAttacks(this.world, FIXED_STEP)
          stepEnemyProjectiles(this.world, FIXED_STEP, playerStart)
        }
        finishDashStep(this.world, FIXED_STEP)
      }
      this.world.elapsed += FIXED_STEP
      this.accumulator = Math.max(0, this.accumulator - FIXED_STEP)
      steps++
      if (this.world.health <= 0) {
        this.status = 'game_over'
        this.accumulator = 0
        this.clearInput()
        this.listeners.forEach((listener) => listener())
        break
      }
    }
    this.publishHud()
  }
}
