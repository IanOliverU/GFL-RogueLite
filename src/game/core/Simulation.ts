import { movePlayer } from '../systems/movement'
import { createWorld, type GroundPoint } from './world'
import type { StageId } from '../data/arena'
import type { CharacterId } from '../data/characters'
import { updateAim } from '../systems/targeting'
import { resolveThirdPersonTarget } from '../systems/thirdPersonAim'
import { stepWeapon } from '../systems/weapons'
import { stepProjectiles } from '../systems/projectiles'
import { stepEnemies } from '../systems/enemies'
import { finishDashStep, stepDash } from '../systems/dash'
import { stepRangedAttacks } from '../systems/rangedAttacks'
import { stepEnemyProjectiles } from '../systems/enemyProjectiles'
import { applyChoice, grantXp, offerChoices, stepGems, stepPulse } from '../systems/progression'
import { xpForLevel, type UpgradeChoice } from '../data/progression'

export const FIXED_STEP = 1 / 60
const MAX_STEPS = 6
export type RunStatus = 'selection' | 'playing' | 'paused' | 'levelup' | 'game_over'
export type PauseReason = 'manual' | 'focus' | 'graphics'

/** Owns gameplay state; no browser, React or Three.js dependencies. */
export class Simulation {
  world = createWorld()
  readonly stage: StageId
  readonly held = new Set<string>()
  pointer: { x: number; y: number } | null = null
  /** Deliberate fire input for the third-person experiment (left mouse held). */
  fireHeld = false
  /** True in the third-person experiment: crosshair aim, manual fire. */
  readonly thirdPerson: boolean
  private accumulator = 0
  private status: RunStatus = 'playing'
  pauseReason: PauseReason = 'manual'
  private readonly listeners = new Set<() => void>()
  private hud = { health: 100, maxHealth: 100, ammo: 6, reloading: false, kills: 0, shots: 0, dashCooldown: 0, dashing: false, elapsed: 0, level: 1, xp: 0, xpNeed: 5, evolution: false }
  private dashRequested = false
  private clampResumeDelta = false

  constructor(mode: 'playground' | 'combat' | 'thirdperson' = 'playground', stage: StageId = 'district') {
    this.stage = stage
    this.thirdPerson = mode === 'thirdperson'
    this.world = createWorld('sabrina', false, stage)
    if (mode === 'combat' || mode === 'thirdperson') this.status = 'selection'
  }

  getHud = () => this.hud
  private publishHud() {
    const world = this.world
    const next = { health: world.health, maxHealth: world.maxHealth, ammo: world.weapon.ammo, reloading: world.weapon.reloadRemaining > 0, kills: world.kills, shots: world.shots, dashCooldown: Math.ceil(world.dash.cooldown * 10) / 10, dashing: world.dash.remaining > 0, elapsed: Math.floor(world.elapsed), level: world.level, xp: world.xp, xpNeed: xpForLevel(world.level), evolution: world.evolution }
    if (JSON.stringify(next) !== JSON.stringify(this.hud)) {
      this.hud = next
      this.listeners.forEach((listener) => listener())
    }
  }

  startRun(dollId: CharacterId, opts?: { bonusXp?: number }): void {
    this.world = createWorld(dollId, true, this.stage)
    this.choiceVersion = 0
    this.clearInput()
    this.accumulator = 0
    this.clampResumeDelta = false
    this.pauseReason = 'manual'
    this.status = 'playing'
    // Development-only shortcut (e.g. ?devxp=200): bonus XP for testing
    // progression. Never granted on retry/selection flows or in normal play.
    if ((opts?.bonusXp ?? 0) > 0) grantXp(this.world, Math.floor(opts!.bonusXp!))
    this.publishHud()
    this.listeners.forEach((listener) => listener())
  }

  getChoices = (): UpgradeChoice[] => offerChoices(this.world)
  /** Bumps whenever the pending choice list changes so the dialog re-renders. */
  getChoiceVersion = (): number => this.choiceVersion
  private choiceVersion = 0

  /** Apply a level-up choice. Returns false when there is no choice to make. */
  chooseUpgrade(index: number): boolean {
    if (this.status !== 'levelup') return false
    const choices = offerChoices(this.world)
    const choice = choices[index]
    if (!choice || this.world.pendingLevels <= 0) return false
    applyChoice(this.world, choice)
    this.world.pendingLevels--
    this.choiceVersion++
    this.clearInput()
    this.accumulator = 0
    if (this.world.pendingLevels <= 0) {
      // Last queued level resolved: resume with a clamped delta, no catch-up.
      this.clampResumeDelta = true
      this.status = 'playing'
    }
    this.publishHud()
    this.listeners.forEach((listener) => listener())
    return true
  }

  returnToSelection(): void {
    this.world = createWorld(this.world.dollId, false, this.stage)
    this.choiceVersion = 0
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
    this.fireHeld = false
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

  advance(delta: number, sampleAim?: (player: GroundPoint) => GroundPoint | null, cameraYaw = 0): void {
    if (this.status !== 'playing') { this.accumulator = 0; return }
    if (!Number.isFinite(delta) || delta < 0) return
    const yaw = cameraYaw
    if (this.clampResumeDelta) { delta = Math.min(delta, FIXED_STEP); this.clampResumeDelta = false }
    this.accumulator += Math.min(delta, FIXED_STEP * MAX_STEPS)
    // Third-person crosshair targets resolve through the muzzle path so the
    // authoritative direction never endorses shooting through nearby cover.
    const sampleResolved = sampleAim
      ? (player: GroundPoint) => {
        const target = sampleAim(player)
        return this.thirdPerson ? resolveThirdPersonTarget(this.world, target) : target
      }
      : undefined
    let steps = 0
    while (this.accumulator + 1e-10 >= FIXED_STEP && steps < MAX_STEPS) {
      const playerStart = { ...this.world.player }
      const aimPresent = this.pointer !== null || this.thirdPerson
      if (this.dashRequested && sampleResolved && aimPresent) updateAim(this.world, sampleResolved(this.world.player))
      const dashing = this.world.combat && stepDash(this.world, this.held, this.dashRequested, FIXED_STEP, yaw)
      this.dashRequested = false
      if (!dashing) movePlayer(this.world.player, this.held, FIXED_STEP, this.world.obstacles, yaw)
      // Renderer supplies projection only; simulation owns direction and firing order.
      if (sampleResolved && aimPresent) updateAim(this.world, sampleResolved(this.world.player))
      if (this.world.combat) {
        stepEnemies(this.world, FIXED_STEP)
        if (this.world.health > 0) {
          stepPulse(this.world, FIXED_STEP)
          // Third-person fires only while the fire button is deliberately held;
          // legacy modes keep automatic range-gated fire while aimed.
          stepWeapon(this.world, FIXED_STEP, this.thirdPerson ? this.fireHeld : this.pointer !== null)
          stepProjectiles(this.world, FIXED_STEP)
          stepGems(this.world, FIXED_STEP)
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
      if (this.world.combat && this.world.pendingLevels > 0) {
        // Queued level-ups open the upgrade screen with everything frozen.
        this.status = 'levelup'
        this.accumulator = 0
        this.clearInput()
        this.listeners.forEach((listener) => listener())
        break
      }
    }
    this.publishHud()
  }
}
