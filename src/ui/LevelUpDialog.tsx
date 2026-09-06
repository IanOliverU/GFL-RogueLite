import { useEffect, useRef, useSyncExternalStore, type KeyboardEvent } from 'react'
import type { Simulation } from '../game/core/Simulation'
import { evolutionProgress } from '../game/systems/progression'

/**
 * Modal upgrade choice. The simulation is frozen while this is open; choosing
 * an option cannot leak into gameplay because inputs are cleared on both
 * entering and leaving the level-up state.
 */
export function LevelUpDialog({ simulation }: { simulation: Simulation }) {
  const firstButton = useRef<HTMLButtonElement>(null)
  useSyncExternalStore(simulation.subscribe, simulation.getChoiceVersion)
  const choices = simulation.getChoices()
  const pending = simulation.world.pendingLevels
  const level = simulation.world.level
  const progress = evolutionProgress(simulation.world)
  useEffect(() => { firstButton.current?.focus() }, [])
  const cycleFocus = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return
    event.preventDefault()
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('.levelup-card button')]
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
    buttons[(index + 1) % buttons.length]?.focus()
  }
  return <div className="pause-backdrop">
    <section className="pause-card levelup-card" role="dialog" aria-modal="true" aria-labelledby="levelup-title" onKeyDown={cycleFocus}>
      <p className="eyebrow">LEVEL {level} · {pending} CHOICE{pending === 1 ? '' : 'S'} QUEUED</p>
      <h2 id="levelup-title">Choose an upgrade</h2>
      <p>Gameplay is frozen. Pick one;{pending > 1 ? ' more choices follow.' : ' then the run resumes.'}</p>
      {choices.map((choice, index) => (
        <button
          key={`${choice.kind}-${choice.id ?? 'pick'}`}
          ref={index === 0 ? firstButton : undefined}
          className={choice.kind === 'evolution' ? 'evolution-button' : 'secondary-button'}
          onClick={() => simulation.chooseUpgrade(index)}
        >
          <b>{choice.title}</b>
          {choice.rankLabel && <small>{choice.rankLabel}</small>}
          <span className="choice-description">{choice.description}</span>
        </button>
      ))}
      {progress && <small>{progress}</small>}
    </section>
  </div>
}
