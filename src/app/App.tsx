import { Canvas } from '@react-three/fiber'
import { useState, useSyncExternalStore } from 'react'
import { Simulation } from '../game/core/Simulation'
import { setCameraPreset } from '../game/data/camera'
import type { CharacterId } from '../game/data/characters'
import { PlaygroundScene } from '../render/PlaygroundScene'
import { PauseDialog } from '../ui/PauseDialog'
import { RenderErrorBoundary } from '../ui/RenderErrorBoundary'
import { CharacterSelection } from '../ui/CharacterSelection'
import { CombatHud } from '../ui/CombatHud'
import { GameOverDialog } from '../ui/GameOverDialog'
import { LevelUpDialog } from '../ui/LevelUpDialog'

export function App() {
  const params = new URLSearchParams(window.location.search)
  // Camera experiment override (?camera=classic|angled); defaults to Angled.
  const requestedCamera = params.get('camera')
  if (requestedCamera === 'classic' || requestedCamera === 'angled') {
    setCameraPreset(requestedCamera)
  }
  // Development-only progression shortcut: ?devxp=N grants N XP on run start.
  const devXp = Math.max(0, Math.floor(Number(params.get('devxp')) || 0))
  const [simulation] = useState(() => new Simulation(params.get('mode') === 'playground' ? 'playground' : 'combat'))
  const [selected, setSelected] = useState<CharacterId>('sabrina')
  const status = useSyncExternalStore(simulation.subscribe, simulation.getStatus)
  const inSelection = status === 'selection'
  return <main className="app-shell">
    {inSelection && <header className="topbar">
      <div className="brand-mark" aria-hidden="true">G<span>02</span></div>
      <div><p className="eyebrow">EXILIUM / FAN GAME</p><h1>Combat prototype</h1></div>
      <div className="build-tag">M4 <span>PROGRESSION</span></div>
    </header>}
    {inSelection ? <CharacterSelection selected={selected} onSelect={setSelected} onStart={() => simulation.startRun(selected, devXp > 0 ? { bonusXp: devXp } : undefined)} /> : <>
      <section className="arena-view" aria-label="Movement and aiming arena">
        <RenderErrorBoundary>
          <Canvas shadows="percentage" orthographic camera={{ position: [0, 22, 18], near: 0.1, far: 250 }} dpr={[1, 1.5]} fallback={<div className="graphics-error">WebGL is unavailable. Try a browser with graphics acceleration enabled.</div>}>
            <PlaygroundScene simulation={simulation} />
          </Canvas>
        </RenderErrorBoundary>
        <div className="scene-label"><span className="status-dot" /> {status.replace('_', ' ').toUpperCase()}<small>CHECKPOINT / TEST COURTYARD</small></div>
        <button className="pause-overlay" disabled={status !== 'playing'} onClick={() => simulation.pause()}>Pause <kbd>Esc</kbd></button>
        {simulation.world.combat && <CombatHud simulation={simulation} />}
        <div className="scene-note"><span>01</span> {simulation.world.combat ? 'Collect XP. Choose upgrades. Evolve.' : 'Movement & targeting'}<small>Original placeholders · flat ground · camera follow</small></div>
        {status === 'paused' && <PauseDialog simulation={simulation} />}
        {status === 'levelup' && <LevelUpDialog simulation={simulation} />}
        {status === 'game_over' && <GameOverDialog simulation={simulation} />}
      </section>
    </>}
  </main>
}
