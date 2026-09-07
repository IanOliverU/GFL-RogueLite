import { useSyncExternalStore } from 'react'
import type { Simulation } from '../game/core/Simulation'
import { CHARACTERS } from '../game/data/characters'
import { WEAPONS } from '../game/data/weapons'
import { deriveWeapon } from '../game/systems/progression'

export function formatRunTime(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds))
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`
}

export function CombatHud({ simulation, fireHint }: { simulation: Simulation; fireHint?: string }) {
  const hud = useSyncExternalStore(simulation.subscribe, simulation.getHud)
  const doll = CHARACTERS[simulation.world.dollId]
  const weapon = WEAPONS[doll.weaponId]
  const magazine = deriveWeapon(simulation.world).magazine
  const xpFraction = hud.xpNeed > 0 ? Math.min(1, hud.xp / hud.xpNeed) : 0
  return <div className="combat-hud">
    <div><b>{doll.name}</b><small>{weapon.name} · PLACEHOLDER{hud.evolution ? ' · EVO' : ''}</small></div>
    <div><b>LV {hud.level}</b><small>LEVEL</small></div>
    <div className={hud.health <= 30 ? 'health-low' : ''}>HP <b>{hud.health} / {hud.maxHealth}</b></div>
    <div>AMMO <b>{hud.ammo} / {magazine}</b><small>{hud.reloading ? 'RELOADING' : (fireHint ?? 'AUTO · ENEMY IN RANGE')}</small></div>
    <div className={hud.dashCooldown > 0 && !hud.dashing ? '' : 'dash-ready'}>DASH <b>{hud.dashing ? 'DASHING' : hud.dashCooldown > 0 ? `${hud.dashCooldown.toFixed(1)}s` : 'READY'}</b><small>SPACE</small></div>
    <div>DEFEATED <b>{hud.kills}</b></div>
    <div>TIME <b>{formatRunTime(hud.elapsed)}</b></div>
    <div className="xp-strip" aria-label={`Experience ${hud.xp} of ${hud.xpNeed}`}><i style={{ width: `${Math.round(xpFraction * 100)}%` }} /></div>
  </div>
}
