import { useEffect, useRef } from 'react'
import type { Simulation } from '../game/core/Simulation'
import { CHARACTERS } from '../game/data/characters'

export function GameOverDialog({ simulation }: { simulation: Simulation }) {
  const retry = useRef<HTMLButtonElement>(null)
  const selection = useRef<HTMLButtonElement>(null)
  const world = simulation.world
  useEffect(() => { retry.current?.focus() }, [])
  return <div className="pause-backdrop"><section className="pause-card" role="dialog" aria-modal="true" aria-labelledby="game-over-title" onKeyDown={(event) => {
    if (event.key === 'Tab') { event.preventDefault(); if (document.activeElement === retry.current) selection.current?.focus(); else retry.current?.focus() }
  }}>
    <p className="eyebrow">RUN ENDED</p><h2 id="game-over-title">Game over</h2>
    <p>{CHARACTERS[world.dollId].name} · {world.kills} defeated · {Math.floor(world.elapsed)} seconds</p>
    <button ref={retry} onClick={() => simulation.startRun(world.dollId)}>Retry with {CHARACTERS[world.dollId].name}</button>
    <button ref={selection} className="secondary-button" onClick={() => simulation.returnToSelection()}>Return to selection</button>
    <small>Health, ammunition and all run state reset on retry.</small>
  </section></div>
}
