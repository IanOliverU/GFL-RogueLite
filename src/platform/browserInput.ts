import type { Simulation } from '../game/core/Simulation'

const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD'])

/** A single listener owner; return cleanup for React StrictMode and unmount. */
export function bindBrowserInput(simulation: Simulation, canvas: HTMLCanvasElement) {
  let contextLost = false
  const resume = () => {
    if (!contextLost && document.visibilityState === 'visible' && document.hasFocus()) simulation.resume()
  }
  const keydown = (event: KeyboardEvent) => {
    if (event.code === 'Escape' && !event.repeat) {
      event.preventDefault()
      if (simulation.getStatus() === 'playing') simulation.pause()
      else resume()
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
  const blur = () => simulation.pause('focus')
  const visibility = () => { if (document.hidden) blur() }
  const pointermove = (event: PointerEvent) => {
    if (simulation.getStatus() === 'playing') simulation.pointer = { x: event.clientX, y: event.clientY }
  }
  const leave = () => { simulation.pointer = null }
  const lost = (event: Event) => {
    event.preventDefault()
    contextLost = true
    simulation.pause('graphics')
  }
  const restored = () => { contextLost = false; simulation.pause('manual') }
  window.addEventListener('keydown', keydown)
  window.addEventListener('keyup', keyup)
  window.addEventListener('blur', blur)
  document.addEventListener('visibilitychange', visibility)
  canvas.addEventListener('pointermove', pointermove)
  canvas.addEventListener('pointerleave', leave)
  canvas.addEventListener('webglcontextlost', lost)
  canvas.addEventListener('webglcontextrestored', restored)
  if (document.hidden || !document.hasFocus()) blur()
  return () => {
    window.removeEventListener('keydown', keydown)
    window.removeEventListener('keyup', keyup)
    window.removeEventListener('blur', blur)
    document.removeEventListener('visibilitychange', visibility)
    canvas.removeEventListener('pointermove', pointermove)
    canvas.removeEventListener('pointerleave', leave)
    canvas.removeEventListener('webglcontextlost', lost)
    canvas.removeEventListener('webglcontextrestored', restored)
    simulation.clearInput()
  }
}
