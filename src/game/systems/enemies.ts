import { createEnemy, PLAYER_RADIUS, type GroundPoint, type World } from '../core/world'
import { MAX_ENEMIES, PURSUER, SPAWN_INTERVAL, type Obstacle } from '../data/arena'
import { moveCircle, segmentBox } from './collision'

const distance = (a: GroundPoint, b: GroundPoint) => Math.hypot(a.x - b.x, a.z - b.z)

/** Tiny visibility graph around the single M2 cover block, recalculated from current positions. */
export function pursuitTarget(start: GroundPoint, end: GroundPoint, obstacles: readonly Obstacle[]): GroundPoint {
  const clear = (a: GroundPoint, b: GroundPoint) => obstacles.every((box) => segmentBox(a, b, box, PURSUER.radius) === null)
  if (clear(start, end)) return end
  const margin = PURSUER.radius + 0.06
  const nodes = [start, ...obstacles.flatMap((box) => [
    { x: box.minX - margin, z: box.minZ - margin }, { x: box.maxX + margin, z: box.minZ - margin },
    { x: box.minX - margin, z: box.maxZ + margin }, { x: box.maxX + margin, z: box.maxZ + margin },
  ]), end]
  const costs = nodes.map(() => Infinity), first = nodes.map(() => 0), visited = new Set<number>()
  costs[0] = 0
  for (let step = 0; step < nodes.length; step++) {
    let current = -1
    for (let i = 0; i < nodes.length; i++) if (!visited.has(i) && (current < 0 || costs[i] < costs[current])) current = i
    if (current < 0 || costs[current] === Infinity) break
    if (current === nodes.length - 1) return nodes[first[current]]
    visited.add(current)
    for (let i = 1; i < nodes.length; i++) {
      const cost = costs[current] + distance(nodes[current], nodes[i])
      if (cost < costs[i] && clear(nodes[current], nodes[i])) { costs[i] = cost; first[i] = current === 0 ? i : first[current] }
    }
  }
  return start
}

const SPAWNS: readonly GroundPoint[] = [{ x: 0, z: -9 }, { x: 8, z: 8 }, { x: -8, z: 8 }, { x: 8, z: -8 }, { x: -8, z: -8 }, { x: 0, z: 9 }]

export function stepEnemies(world: World, dt: number) {
  world.hurtRemaining = Math.max(0, world.hurtRemaining - dt)
  for (const enemy of world.enemies) {
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt)
    const goal = pursuitTarget(enemy, world.player, world.obstacles)
    const length = distance(enemy, goal)
    const speed = Math.min(PURSUER.speed * dt, length)
    moveCircle(enemy, (length ? (goal.x - enemy.x) / length * speed : 0) + enemy.knockback.x * dt, (length ? (goal.z - enemy.z) / length * speed : 0) + enemy.knockback.z * dt, PURSUER.radius, world.obstacles)
    enemy.knockback.x *= Math.exp(-10 * dt)
    enemy.knockback.z *= Math.exp(-10 * dt)
    if (world.hurtRemaining <= 1e-8 && distance(enemy, world.player) <= PURSUER.radius + PLAYER_RADIUS) {
      world.health = Math.max(0, world.health - PURSUER.damage)
      world.hurtRemaining = PURSUER.contactInterval
    }
  }
  world.spawnTimer -= dt
  if (world.spawnTimer <= 0) {
    world.spawnTimer += SPAWN_INTERVAL
    if (world.enemies.length < MAX_ENEMIES) {
      for (let attempt = 0; attempt < SPAWNS.length; attempt++) {
        const spawn = SPAWNS[world.spawnIndex++ % SPAWNS.length]
        if (distance(spawn, world.player) > 4) { world.enemies.push(createEnemy(world.nextId++, spawn.x, spawn.z)); break }
      }
    }
  }
}
