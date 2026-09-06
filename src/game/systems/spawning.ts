import { createEnemy, type World } from '../core/world'
import { MAX_ENEMIES, type EnemyKind } from '../data/arena'
import { FAR_SPAWN_DISTANCE, MIN_SPAWN_DISTANCE, pressureAt, SPAWN_POINTS } from '../data/pressure'

export function stepSpawning(world: World, dt: number) {
  world.spawnTimer -= dt
  if (world.spawnTimer > 1e-8) return
  const phase = pressureAt(world.elapsed)
  // Capped populations do not bank missed spawns for a later burst.
  world.spawnTimer = phase.interval
  if (world.enemies.length >= Math.min(phase.maxAlive, MAX_ENEMIES)) return
  const rangedCount = world.enemies.filter((enemy) => enemy.kind === 'ranged').length
  const kind: EnemyKind = world.spawnCount % 3 === 0 && rangedCount < phase.maxRanged ? 'ranged' : 'pursuer'
  let fallback: { x: number; z: number } | null = null
  for (let attempt = 0; attempt < SPAWN_POINTS.length; attempt++) {
    const spawn = SPAWN_POINTS[world.spawnIndex++ % SPAWN_POINTS.length]
    if (Math.hypot(spawn.x - world.player.x, spawn.z - world.player.z) < MIN_SPAWN_DISTANCE) continue
    if (world.enemies.some((enemy) => Math.hypot(spawn.x - enemy.x, spawn.z - enemy.z) < 1.5)) continue
    // Prefer out-of-view spawns so enemies rarely materialize beside the player.
    if (Math.hypot(spawn.x - world.player.x, spawn.z - world.player.z) >= FAR_SPAWN_DISTANCE) {
      world.enemies.push(createEnemy(world.nextId++, spawn.x, spawn.z, kind))
      world.spawnCount++
      return
    }
    fallback ??= spawn
  }
  if (fallback) {
    world.enemies.push(createEnemy(world.nextId++, fallback.x, fallback.z, kind))
    world.spawnCount++
  }
}
