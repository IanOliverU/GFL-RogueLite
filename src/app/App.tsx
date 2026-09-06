import { Canvas } from '@react-three/fiber'
import { useState, useSyncExternalStore } from 'react'
import { Simulation } from '../game/core/Simulation'
import { PlaygroundScene } from '../render/PlaygroundScene'
import { PauseDialog } from '../ui/PauseDialog'
import { RenderErrorBoundary } from '../ui/RenderErrorBoundary'

export function App() {
  const [simulation] = useState(() => new Simulation())
  const status = useSyncExternalStore(simulation.subscribe, simulation.getStatus)
  return <main className="app-shell">
    <header className="topbar">
      <div className="brand-mark" aria-hidden="true">G<span>02</span></div>
      <div><p className="eyebrow">EXILIUM / FAN GAME</p><h1>Movement playground</h1></div>
      <div className="build-tag">M1 <span>FOUNDATION</span></div>
      <button className="pause-button" disabled={status === 'paused'} onClick={() => simulation.pause()}>Pause <kbd>Esc</kbd></button>
    </header>
    <section className="arena-view" aria-label="Movement and aiming arena">
      <RenderErrorBoundary>
        <Canvas orthographic camera={{ position: [0, 22, 18], near: 0.1, far: 250 }} dpr={[1, 1.5]} fallback={<div className="graphics-error">WebGL is unavailable. Try a browser with graphics acceleration enabled.</div>}>
          <PlaygroundScene simulation={simulation} />
        </Canvas>
      </RenderErrorBoundary>
      <div className="scene-label"><span className="status-dot" /> {status === 'playing' ? 'PLAYGROUND ACTIVE' : 'PAUSED'}<small>CHECKPOINT / TEST COURTYARD</small></div>
      <div className="scene-note"><span>01</span> Movement & targeting<small>Placeholder doll · flat ground · camera follow</small></div>
      {status === 'paused' && <PauseDialog simulation={simulation} />}
    </section>
    <footer className="control-bar">
      <div><span className="key-group"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span> Move</div>
      <div><span className="cursor-icon">↗</span> Mouse to aim</div>
      <p>Walk the perimeter. Keep your cursor still while moving.</p>
      <span className="prototype-tag">ORIGINAL PLACEHOLDERS</span>
    </footer>
  </main>
}
