import { useEffect, useRef, useSyncExternalStore, type KeyboardEvent } from 'react'
import type { Simulation } from '../game/core/Simulation'

export function PauseDialog({ simulation }: { simulation: Simulation }) {
  const resumeButton = useRef<HTMLButtonElement>(null)
  const restartButton = useRef<HTMLButtonElement>(null)
  const selectionButton = useRef<HTMLButtonElement>(null)
  const reason = useSyncExternalStore(simulation.subscribe, simulation.getPauseReason)
  useEffect(() => { resumeButton.current?.focus() }, [])
  const resume = () => {
    if (simulation.pauseReason !== 'graphics' && document.hasFocus() && !document.hidden) {
      simulation.resume()
      resumeButton.current?.blur()
    }
  }
  const cycleFocus = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return
    event.preventDefault()
    const buttons = [resumeButton.current, restartButton.current, selectionButton.current]
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
    buttons[(index + 1) % buttons.length]?.focus()
  }
  const inCombat = simulation.world.combat
  return <div className="pause-backdrop">
    <section className="pause-card" role="dialog" aria-modal="true" aria-labelledby="pause-title" onKeyDown={cycleFocus}>
      <p className="eyebrow">SIMULATION ON HOLD</p>
      <h2 id="pause-title">{inCombat ? 'Run paused' : 'Playground paused'}</h2>
      <p>{reason === 'focus' ? 'Window focus was lost. Inputs have been cleared.' : reason === 'graphics' ? 'Graphics context lost. Wait for recovery, or reload this page.' : 'Take your time. Resume when you are ready.'}</p>
      <button ref={resumeButton} aria-disabled={reason === 'graphics'} onClick={resume}>{inCombat ? 'Resume run' : 'Resume playground'} <span>↗</span></button>
      {inCombat && <button ref={restartButton} className="secondary-button" onClick={() => simulation.startRun(simulation.world.dollId)}>Restart run</button>}
      {inCombat && <button ref={selectionButton} className="secondary-button" onClick={() => simulation.returnToSelection()}>Change character</button>}
      <small>{inCombat ? 'Restarting or changing character discards the current run. ' : ''}Press fresh movement keys after resuming.</small>
    </section>
  </div>
}
