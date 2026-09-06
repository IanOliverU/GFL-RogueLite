import { Canvas } from '@react-three/fiber'
import { useState, useSyncExternalStore } from 'react'
import { Simulation } from '../game/core/Simulation'
import type { CharacterId } from '../game/data/characters'
import { PlaygroundScene } from '../render/PlaygroundScene'
import { PauseDialog } from '../ui/PauseDialog'
import { RenderErrorBoundary } from '../ui/RenderErrorBoundary'
import { CharacterSelection } from '../ui/CharacterSelection'
import { CombatHud } from '../ui/CombatHud'
import { GameOverDialog } from '../ui/GameOverDialog'

export function App() {
  const [simulation] = useState(() => new Simulation(new URLSearchParams(window.location.search).get('mode') === 'playground' ? 'playground' : 'combat'))
  const [selected, setSelected] = useState<CharacterId>('sabrina')
  const status = useSyncExternalStore(simulation.subscribe, simulation.getStatus)
  const inSelection = status === 'selection'
  return <main className="app-shell">
    <header className="topbar">
      <div className="brand-mark" aria-hidden="true">G<span>02</span></div>
      <div><p className="eyebrow">EXILIUM / FAN GAME</p><h1>{inSelection || simulation.world.combat ? 'Combat prototype' : 'Movement playground'}</h1></div>
      <div className="build-tag">M2 <span>SIX T-DOLLS</span></div>
      {!inSelection && <button className="pause-button" disabled={status !== 'playing'} onClick={() => simulation.pause()}>Pause <kbd>Esc</kbd></button>}
    </header>
    {inSelection ? <CharacterSelection selected={selected} onSelect={setSelected} onStart={() => simulation.startRun(selected)} /> : <>
      <section className="arena-view" aria-label="Movement and aiming arena">
        <RenderErrorBoundary>
          <Canvas orthographic camera={{ position: [0, 22, 18], near: 0.1, far: 250 }} dpr={[1, 1.5]} fallback={<div className="graphics-error">WebGL is unavailable. Try a browser with graphics acceleration enabled.</div>}>
            <PlaygroundScene simulation={simulation} />
          </Canvas>
        </RenderErrorBoundary>
        <div className="scene-label"><span className="status-dot" /> {status.replace('_', ' ').toUpperCase()}<small>CHECKPOINT / TEST COURTYARD</small></div>
        {simulation.world.combat && <CombatHud simulation={simulation} />}
        <div className="scene-note"><span>01</span> {simulation.world.combat ? 'Aim freely. Keep moving.' : 'Movement & targeting'}<small>Original placeholders · flat ground · camera follow</small></div>
        {status === 'paused' && <PauseDialog simulation={simulation} />}
        {status === 'game_over' && <GameOverDialog simulation={simulation} />}
      </section>
      <footer className="control-bar">
        <div><span className="key-group"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span> Move</div>
        <div><span className="cursor-icon">↗</span> Mouse to aim</div>
        <p>{simulation.world.combat ? 'Auto-fire in enemy range · Automatic reload · No aim assistance' : 'Walk the perimeter. Keep your cursor still while moving.'}</p>
        <span className="prototype-tag">PROTOTYPE FAN ADAPTATIONS</span>
      </footer>
    </>}
  </main>
}
