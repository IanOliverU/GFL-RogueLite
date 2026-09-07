import { Canvas } from '@react-three/fiber'
import { useCallback, useRef, useState, useSyncExternalStore } from 'react'
import { Simulation } from '../game/core/Simulation'
import { setCameraPreset } from '../game/data/camera'
import { THIRDPERSON_DOLL_IDS, THIRD_PERSON } from '../game/data/thirdPerson'
import type { CharacterId } from '../game/data/characters'
import { PlaygroundScene } from '../render/PlaygroundScene'
import { ThirdPersonScene } from '../render/ThirdPersonScene'
import { requestThirdPersonLock } from '../platform/thirdPersonInput'
import { PauseDialog } from '../ui/PauseDialog'
import { RenderErrorBoundary } from '../ui/RenderErrorBoundary'
import { CharacterSelection } from '../ui/CharacterSelection'
import { CombatHud } from '../ui/CombatHud'
import { GameOverDialog } from '../ui/GameOverDialog'
import { LevelUpDialog } from '../ui/LevelUpDialog'

export function App() {
  const params = new URLSearchParams(window.location.search)
  // Third-person control experiment (?mode=thirdperson). Separate camera,
  // input, aiming and test arena; the combat engine is shared, never forked.
  const isThirdPerson = params.get('mode') === 'thirdperson'
  // Camera experiment override (?camera=classic|angled); defaults to Angled.
  const requestedCamera = params.get('camera')
  if (requestedCamera === 'classic' || requestedCamera === 'angled') {
    setCameraPreset(requestedCamera)
  }
  // Development-only progression shortcut: ?devxp=N grants N XP on run start.
  const devXp = Math.max(0, Math.floor(Number(params.get('devxp')) || 0))
  const [simulation] = useState(() => {
    const mode = isThirdPerson ? 'thirdperson' : params.get('mode') === 'playground' ? 'playground' : 'combat'
    return new Simulation(mode, isThirdPerson ? 'thirdperson' : 'district')
  })
  const [selected, setSelected] = useState<CharacterId>('sabrina')
  const status = useSyncExternalStore(simulation.subscribe, simulation.getStatus)
  const inSelection = status === 'selection'
  const orbitRef = useRef({ yaw: 0, pitch: (THIRD_PERSON.startPitchDegrees * Math.PI) / 180 })
  const [tpLocked, setTpLocked] = useState(false)
  const [tpLockError, setTpLockError] = useState<string | null>(null)
  const handleLockChange = useCallback((locked: boolean) => {
    setTpLocked(locked)
    if (locked) setTpLockError(null)
  }, [])
  const handleLockError = useCallback((message: string) => setTpLockError(message), [])
  if (isThirdPerson) {
    return <main className="app-shell">
      {inSelection ? <CharacterSelection
        selected={THIRDPERSON_DOLL_IDS.includes(selected) ? selected : 'sabrina'}
        onSelect={setSelected}
        onStart={() => simulation.startRun(THIRDPERSON_DOLL_IDS.includes(selected) ? selected : 'sabrina', devXp > 0 ? { bonusXp: devXp } : undefined)}
        allowedIds={THIRDPERSON_DOLL_IDS}
        intro="Third-person control experiment: three modeled dolls with scripted locomotion. Prototype fan-game adaptations; not verified official kits."
        help="WASD to move · Mouse to look · Hold Left Click to fire · Space to dash · Escape to pause"
      /> : <>
        <section className="arena-view" aria-label="Third-person experiment arena">
          <RenderErrorBoundary>
            <Canvas shadows dpr={[1, 1.5]} camera={{ fov: 62, near: 0.1, far: 500, position: [0, 4, 7] }} fallback={<div className="graphics-error">WebGL is unavailable. Try a browser with graphics acceleration enabled.</div>}>
              <ThirdPersonScene simulation={simulation} orbit={orbitRef.current} onLockChange={handleLockChange} onLockError={handleLockError} />
            </Canvas>
          </RenderErrorBoundary>
          <div className="scene-label"><span className="status-dot" /> {status.replace('_', ' ').toUpperCase()}<small>THIRD-PERSON EXPERIMENT</small></div>
          <button className="pause-overlay" disabled={status !== 'playing'} onClick={() => simulation.pause()}>Pause <kbd>Esc</kbd></button>
          {simulation.world.combat && <CombatHud simulation={simulation} fireHint="HOLD CLICK TO FIRE" />}
          {status === 'playing' && <div className={tpLocked ? 'tp-crosshair' : 'tp-crosshair tp-crosshair-idle'} aria-hidden="true" />}
          {status === 'playing' && !tpLocked && tpLockError === null && <button
            className="tp-lock-overlay"
            onClick={() => requestThirdPersonLock(document.querySelector('.arena-view canvas'))}
          >Click to enter third-person control<span>WASD move · Mouse look · Hold Left Click to fire · Space dash · Esc pause</span></button>}
          {status === 'playing' && !tpLocked && tpLockError !== null && <div className="tp-lock-overlay" role="alert">
            <p>{tpLockError}</p><a href="?">Back to Classic / Angled selection</a>
          </div>}
          <div className="scene-note"><span>TP</span> Collect XP. Choose upgrades. Evolve.<small>Blockout test arena · animated dolls (?mode=thirdperson)</small></div>
          {status === 'paused' && <PauseDialog simulation={simulation} hideCamera thirdPersonHints />}
          {status === 'levelup' && <LevelUpDialog simulation={simulation} />}
          {status === 'game_over' && <GameOverDialog simulation={simulation} />}
        </section>
      </>}
    </main>
  }
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
