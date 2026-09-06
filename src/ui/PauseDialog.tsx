import { useEffect, useRef, useSyncExternalStore } from 'react'
import type { Simulation } from '../game/core/Simulation'

export function PauseDialog({ simulation }: { simulation: Simulation }) {
  const button = useRef<HTMLButtonElement>(null)
  const reason = useSyncExternalStore(simulation.subscribe, simulation.getPauseReason)
  useEffect(() => { button.current?.focus() }, [])
  const resume = () => {
    if (simulation.pauseReason !== 'graphics' && document.hasFocus() && !document.hidden) {
      simulation.resume()
      button.current?.blur()
    }
  }
  return <div className="pause-backdrop">
    <section className="pause-card" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <p className="eyebrow">SIMULATION ON HOLD</p>
      <h2 id="pause-title">{simulation.world.combat ? 'Run paused' : 'Playground paused'}</h2>
      <p>{reason === 'focus' ? 'Window focus was lost. Inputs have been cleared.' : reason === 'graphics' ? 'Graphics context lost. Wait for recovery, or reload this page.' : 'Take your time. Resume when you are ready.'}</p>
      <button ref={button} aria-disabled={reason === 'graphics'} onClick={resume} onKeyDown={(event) => { if (event.key === 'Tab') event.preventDefault() }}>{simulation.world.combat ? 'Resume run' : 'Resume playground'} <span>↗</span></button>
      <small>Press fresh movement keys after resuming.</small>
    </section>
  </div>
}
