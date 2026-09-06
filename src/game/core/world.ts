import { CHARACTERS, type CharacterId } from '../data/characters'
import { WEAPONS } from '../data/weapons'
import { COMBAT_OBSTACLES, ENEMY_DEFINITIONS, RANGED, type EnemyKind, type Obstacle } from '../data/arena'
import { FIRST_SPAWN_DELAY } from '../data/pressure'

export interface GroundPoint { x: number; z: number }
export interface Enemy extends GroundPoint {
  id: number; health: number; hitFlash: number; knockback: GroundPoint
  kind: EnemyKind
  attackCooldown: number
  attack: { remaining: number; target: GroundPoint } | null
}
export interface HostileProjectile extends GroundPoint {
  id: number; direction: GroundPoint; remaining: number
}
export interface DashState { remaining: number; cooldown: number; direction: GroundPoint; origin: GroundPoint }
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
  dash: DashState
  dashes: number
  hostileProjectiles: HostileProjectile[]
  enemyShots: number
  dodgedShots: number
  spawnCount: number
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
    spawnTimer: FIRST_SPAWN_DELAY, spawnIndex: 0, nextId: 2, shots: 0, hits: 0, kills: 0, damageDealt: 0, reloads: 0,
    dash: { remaining: 0, cooldown: 0, direction: { x: 0, z: -1 }, origin: { x: 0, z: 0 } },
    dashes: 0, hostileProjectiles: [], enemyShots: 0, dodgedShots: 0, spawnCount: 0,
  }
}

export function createEnemy(id: number, x: number, z: number, kind: EnemyKind = 'pursuer'): Enemy {
  // Ranged enemies stagger their first attack by id so pairs do not fire in lockstep.
  return {
    id, x, z, kind, health: ENEMY_DEFINITIONS[kind].health, hitFlash: 0, knockback: { x: 0, z: 0 },
    attackCooldown: kind === 'ranged' ? RANGED.initialDelay + (id % 3) * 0.3 : 0, attack: null,
  }
}
