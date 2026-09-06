import { CHARACTER_LIST, CHARACTERS, type CharacterId } from '../game/data/characters'
import { WEAPONS } from '../game/data/weapons'

export function CharacterSelection({ selected, onSelect, onStart }: { selected: CharacterId; onSelect: (id: CharacterId) => void; onStart: () => void }) {
  return <section className="selection-screen" aria-labelledby="selection-title">
    <p className="eyebrow">M2 / SIX BASIC WEAPONS</p>
    <h2 id="selection-title">Select your T-Doll</h2>
    <p className="selection-intro">Six prototype fan-game adaptations. Basic weapons only; these are not verified official kits.</p>
    <div className="doll-grid" role="group" aria-label="Playable T-Dolls">
      {CHARACTER_LIST.map((doll, index) => <button key={doll.id} className="doll-card" aria-label={`Select ${doll.name}`} aria-pressed={selected === doll.id} onClick={() => onSelect(doll.id)}>
        <div className="doll-placeholder" style={{ color: doll.color }} aria-hidden="true"><span>{String(index + 1).padStart(2, '0')}</span><i /></div>
        <small>PLACEHOLDER ART</small>
        <h3>{doll.name}</h3>
        <p>{WEAPONS[doll.weaponId].description}</p>
        <strong>{selected === doll.id ? 'SELECTED' : 'SELECT DOLL'}</strong>
      </button>)}
    </div>
    <div className="selection-actions"><span>{CHARACTERS[selected].name} · {WEAPONS[CHARACTERS[selected].weaponId].name}</span><button className="primary-button" onClick={onStart}>Start run</button></div>
    <p className="selection-help">WASD to move · Mouse to aim · Automatic fire when an enemy is in range · Escape to pause</p>
    <a className="playground-link" href="?mode=playground">Open M1 movement playground</a>
  </section>
}
