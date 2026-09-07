import type { Simulation } from '../game/core/Simulation'
import { clampPitch, THIRD_PERSON } from '../game/data/thirdPerson'

const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD'])

export interface ThirdPersonOrbit {
  yaw: number
  pitch: number
}

/**
 * Third-person experiment input (development-only `?mode=thirdperson`).
 *
 * Mouse-look and deliberate fire require an active pointer lock, which is
 * only ever requested from a direct user gesture (canvas click or the entry
 * overlay button). Losing the lock mid-run pauses; resuming never re-locks
 * by itself. All held/fire/queued state clears on pause, focus loss, and
 * level-up/death transitions through the shared clearInput path.
 */
export function bindThirdPersonInput(
  simulation: Simulation,
  canvas: HTMLCanvasElement,
  orbit: ThirdPersonOrbit,
  hooks: {
    onLockChange: (locked: boolean) => void
    onLockError: (message: string) => void
  },
) {
  const isLocked = () => document.pointerLockElement === canvas
  const exitLock = () => {
    if (document.pointerLockElement) document.exitPointerLock()
  }
  const requestLock = () => {
    if (isLocked()) return
    try {
      const result = canvas.requestPointerLock() as unknown as Promise<void> | undefined
      if (result && typeof result.catch === 'function') {
        result.catch(() => hooks.onLockError(
          'Pointer lock was rejected by the browser. Click the canvas to try again, or return to the Classic/Angled view.',
        ))
      }
    } catch {
      hooks.onLockError(
        'Pointer lock is unavailable in this browser. Keyboard still moves; use the Classic/Angled view for full control.',
      )
    }
  }

  const keydown = (event: KeyboardEvent) => {
    if (event.code === 'Escape' && !event.repeat) {
      event.preventDefault()
      if (simulation.getStatus() === 'playing') {
        exitLock()
        simulation.pause()
      } else if (simulation.getStatus() === 'paused' && document.hasFocus() && !document.hidden) {
        simulation.resume()
      }
      return
    }
    if (event.ctrlKey || event.altKey || event.metaKey) return
    const target = event.target
    if (target instanceof HTMLElement && target.closest('button, input, textarea, select, [contenteditable]')) return
    if (event.code === 'Space') {
      event.preventDefault()
      if (!event.repeat) simulation.requestDash()
      return
    }
    if (movementKeys.has(event.code)) {
      event.preventDefault()
      if (simulation.getStatus() === 'playing' && !event.repeat) simulation.held.add(event.code)
    }
  }
  const keyup = (event: KeyboardEvent) => { simulation.held.delete(event.code) }
  const blur = () => {
    exitLock()
    simulation.pause('focus')
  }
  const visibility = () => { if (document.hidden) blur() }
  const mousedown = (event: MouseEvent) => {
    if (event.button !== 0 || simulation.getStatus() !== 'playing') return
    if (isLocked()) simulation.fireHeld = true
    else requestLock()
  }
  const mouseup = (event: MouseEvent) => {
    if (event.button === 0) simulation.fireHeld = false
  }
  const mousemove = (event: MouseEvent) => {
    if (!isLocked() || simulation.getStatus() !== 'playing') return
    orbit.yaw -= event.movementX * THIRD_PERSON.sensitivity
    orbit.pitch = clampPitch(orbit.pitch + event.movementY * THIRD_PERSON.sensitivity)
  }
  const lockChange = () => {
    const locked = isLocked()
    hooks.onLockChange(locked)
    if (!locked) {
      simulation.fireHeld = false
      // Lock loss mid-run (including browser-reserved Escape) pauses and
      // requires deliberate resume plus an explicit click to re-enter.
      if (simulation.getStatus() === 'playing') simulation.pause()
    }
  }
  const lockError = () => hooks.onLockError(
    'Pointer lock failed in this browser. Click the canvas to try again, or return to the Classic/Angled view.',
  )
  const lost = (event: Event) => {
    event.preventDefault()
    simulation.pause('graphics')
  }
  const restored = () => { simulation.pause('manual') }
  const contextmenu = (event: Event) => {
    if (simulation.getStatus() === 'playing') event.preventDefault()
  }

  window.addEventListener('keydown', keydown)
  window.addEventListener('keyup', keyup)
  window.addEventListener('blur', blur)
  window.addEventListener('mouseup', mouseup)
  window.addEventListener('mousemove', mousemove)
  document.addEventListener('visibilitychange', visibility)
  document.addEventListener('pointerlockchange', lockChange)
  document.addEventListener('pointerlockerror', lockError)
  canvas.addEventListener('mousedown', mousedown)
  canvas.addEventListener('webglcontextlost', lost)
  canvas.addEventListener('webglcontextrestored', restored)
  canvas.addEventListener('contextmenu', contextmenu)
  if (document.hidden || !document.hasFocus()) blur()
  return () => {
    window.removeEventListener('keydown', keydown)
    window.removeEventListener('keyup', keyup)
    window.removeEventListener('blur', blur)
    window.removeEventListener('mouseup', mouseup)
    window.removeEventListener('mousemove', mousemove)
    document.removeEventListener('visibilitychange', visibility)
    document.removeEventListener('pointerlockchange', lockChange)
    document.removeEventListener('pointerlockerror', lockError)
    canvas.removeEventListener('mousedown', mousedown)
    canvas.removeEventListener('webglcontextlost', lost)
    canvas.removeEventListener('webglcontextrestored', restored)
    canvas.removeEventListener('contextmenu', contextmenu)
    simulation.clearInput()
  }
}

/** Deliberate entry action for the click-to-control overlay. */
export function requestThirdPersonLock(canvas: HTMLCanvasElement | null): void {
  if (!canvas) return
  try {
    const result = canvas.requestPointerLock() as unknown as Promise<void> | undefined
    if (result && typeof result.catch === 'function') result.catch(() => undefined)
  } catch {
    // Surfaced through the pointerlockerror path or the overlay message.
  }
}
