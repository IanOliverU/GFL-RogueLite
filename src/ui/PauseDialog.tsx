import { useEffect, useRef, useSyncExternalStore, type KeyboardEvent } from 'react'
import type { Simulation } from '../game/core/Simulation'
import { CAMERA_PRESETS, getCameraPresetId, setCameraPreset, subscribeCameraPreset, type CameraPresetId } from '../game/data/camera'

export function PauseDialog({ simulation }: { simulation: Simulation }) {
  const resumeButton = useRef<HTMLButtonElement>(null)
  const restartButton = useRef<HTMLButtonElement>(null)
  const selectionButton = useRef<HTMLButtonElement>(null)
  const classicButton = useRef<HTMLButtonElement>(null)
  const angledButton = useRef<HTMLButtonElement>(null)
  const reason = useSyncExternalStore(simulation.subscribe, simulation.getPauseReason)
  const cameraPreset = useSyncExternalStore(subscribeCameraPreset, getCameraPresetId)
  useEffect(() => { resumeButton.current?.focus() }, [])
  const resume = () => {
    if (simulation.pauseReason !== 'graphics' && document.hasFocus() && !document.hidden) {
      simulation.resume()
      resumeButton.current?.blur()
    }
  }
  const switchCamera = (id: CameraPresetId) => {
    setCameraPreset(id)
    // Drop any held keys, pointer aim, queued dash or shots: the new frame
    // must not inherit motion aimed at the old camera. The run continues.
    simulation.clearInput()
  }
  const cycleFocus = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return
    event.preventDefault()
    const buttons = [resumeButton.current, restartButton.current, selectionButton.current, classicButton.current, angledButton.current]
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
      <div className="camera-switch" role="group" aria-label="Camera preset">
        <span>Camera</span>
        {(Object.keys(CAMERA_PRESETS) as CameraPresetId[]).map((id) => (
          <button
            key={id}
            ref={id === 'classic' ? classicButton : angledButton}
            className="secondary-button"
            aria-pressed={cameraPreset === id}
            onClick={() => switchCamera(id)}
          >
            {CAMERA_PRESETS[id].label}
          </button>
        ))}
      </div>
      <ul className="control-hints" aria-label="Controls">
        <li><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span> Move</li>
        {inCombat && <li><span><kbd>Space</kbd></span> Dash</li>}
        <li><span className="cursor-icon">↗</span> Mouse to aim{inCombat ? ' · Auto-fire in enemy range · Automatic reload' : ''}</li>
      </ul>
    </section>
  </div>
}
