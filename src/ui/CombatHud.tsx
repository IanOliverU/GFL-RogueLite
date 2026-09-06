import { useSyncExternalStore } from 'react'
import type { Simulation } from '../game/core/Simulation'
import { CHARACTERS } from '../game/data/characters'
import { WEAPONS } from '../game/data/weapons'

export function formatRunTime(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds))
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`
}

export function CombatHud({ simulation }: { simulation: Simulation }) {
  const hud = useSyncExternalStore(simulation.subscribe, simulation.getHud)
  const doll = CHARACTERS[simulation.world.dollId]
  const weapon = WEAPONS[doll.weaponId]
  return <div className="combat-hud">
    <div><b>{doll.name}</b><small>{weapon.name} · PLACEHOLDER</small></div>
    <div className={hud.health <= 30 ? 'health-low' : ''}>HP <b>{hud.health} / {doll.maxHealth}</b></div>
    <div>AMMO <b>{hud.ammo} / {weapon.magazine}</b><small>{hud.reloading ? 'RELOADING' : 'AUTO · ENEMY IN RANGE'}</small></div>
    <div className={hud.dashCooldown > 0 && !hud.dashing ? '' : 'dash-ready'}>DASH <b>{hud.dashing ? 'DASHING' : hud.dashCooldown > 0 ? `${hud.dashCooldown.toFixed(1)}s` : 'READY'}</b><small>SPACE</small></div>
    <div>DEFEATED <b>{hud.kills}</b></div>
    <div>TIME <b>{formatRunTime(hud.elapsed)}</b></div>
  </div>
}
