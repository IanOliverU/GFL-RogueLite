import { CHARACTERS, type CharacterId } from '../data/characters'
import { WEAPONS } from '../data/weapons'
import { COMBAT_OBSTACLES, PURSUER, SPAWN_INTERVAL, type Obstacle } from '../data/arena'

export interface GroundPoint { x: number; z: number }
export interface Enemy extends GroundPoint {
  id: number; health: number; hitFlash: number; knockback: GroundPoint
}
export interface Projectile extends GroundPoint {
  id: number; direction: GroundPoint; speed: number; remaining: number
  damage: number; maxHits: number; knockback: number; hitIds: number[]
}
export interface WeaponState { ammo: number; cooldown: number; reloadRemaining: number; burstRemaining: number }
export interface World {
  player: GroundPoint
  aimDirection: GroundPoint
  aimTarget: GroundPoint | null
  elapsed: number
  dollId: CharacterId
  combat: boolean
  health: number
  hurtRemaining: number
  weapon: WeaponState
  enemies: Enemy[]
  projectiles: Projectile[]
  obstacles: readonly Obstacle[]
  spawnTimer: number
  spawnIndex: number
  nextId: number
  shots: number
  hits: number
  kills: number
  damageDealt: number
  reloads: number
}

export const ARENA_HALF_SIZE = 12
export const PLAYER_RADIUS = 0.4
export const PLAYER_SPEED = 6

export function createWorld(dollId: CharacterId = 'sabrina', combat = false): World {
  return {
    player: { x: 0, z: 0 }, aimDirection: { x: 0, z: -1 }, aimTarget: null, elapsed: 0,
    dollId, combat, health: CHARACTERS[dollId].maxHealth, hurtRemaining: 0,
    weapon: { ammo: WEAPONS[CHARACTERS[dollId].weaponId].magazine, cooldown: 0, reloadRemaining: 0, burstRemaining: 0 },
    enemies: combat ? [createEnemy(1, 0, -4)] : [], projectiles: [], obstacles: combat ? COMBAT_OBSTACLES : [],
    spawnTimer: SPAWN_INTERVAL, spawnIndex: 0, nextId: 2, shots: 0, hits: 0, kills: 0, damageDealt: 0, reloads: 0,
  }
}

export function createEnemy(id: number, x: number, z: number): Enemy {
  return { id, x, z, health: PURSUER.health, hitFlash: 0, knockback: { x: 0, z: 0 } }
}
