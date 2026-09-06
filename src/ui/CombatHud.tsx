import { useSyncExternalStore } from 'react'
import type { Simulation } from '../game/core/Simulation'
import { CHARACTERS } from '../game/data/characters'
import { WEAPONS } from '../game/data/weapons'

export function CombatHud({ simulation }: { simulation: Simulation }) {
  const hud = useSyncExternalStore(simulation.subscribe, simulation.getHud)
  const doll = CHARACTERS[simulation.world.dollId]
  const weapon = WEAPONS[doll.weaponId]
  return <div className="combat-hud">
    <div><b>{doll.name}</b><small>{weapon.name} · PLACEHOLDER</small></div>
    <div className={hud.health <= 30 ? 'health-low' : ''}>HP <b>{hud.health} / {doll.maxHealth}</b></div>
    <div>AMMO <b>{hud.ammo} / {weapon.magazine}</b><small>{hud.reloading ? 'RELOADING' : 'AUTO · ENEMY IN RANGE'}</small></div>
    <div>DEFEATED <b>{hud.kills}</b></div>
  </div>
}
