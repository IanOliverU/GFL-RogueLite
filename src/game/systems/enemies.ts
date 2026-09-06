import { PLAYER_RADIUS, type GroundPoint, type World } from '../core/world'
import { ENEMY_DEFINITIONS, PURSUER, RANGED, type Obstacle } from '../data/arena'
import { moveCircle, segmentBox } from './collision'
import { damagePlayer } from './damage'
import { separateEnemies } from './enemySeparation'
import { stepSpawning } from './spawning'

const distance = (a: GroundPoint, b: GroundPoint) => Math.hypot(a.x - b.x, a.z - b.z)
const STRANDED_DISTANCE = 52
const STRANDED_DELAY = 10

/** Tiny visibility graph around the cover blocks, recalculated from current positions. */
export function pursuitTarget(start: GroundPoint, end: GroundPoint, obstacles: readonly Obstacle[], radius: number = PURSUER.radius): GroundPoint {
  const clear = (a: GroundPoint, b: GroundPoint) => obstacles.every((box) => segmentBox(a, b, box, radius) === null)
  if (clear(start, end)) return end
  const margin = radius + 0.06
  // Most M5 cover is many camera views away. Only nearby or initially blocking
  // pieces can contribute a useful first detour, keeping the small visibility
  // graph bounded as the authored map grows.
  const relevant = obstacles.filter((box) => {
    const centre = { x: (box.minX + box.maxX) / 2, z: (box.minZ + box.maxZ) / 2 }
    return segmentBox(start, end, box, radius) !== null || distance(centre, start) < 18 || distance(centre, end) < 18
  })
  const nodes = [start, ...relevant.flatMap((box) => [
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

export function stepEnemies(world: World, dt: number) {
  world.hurtRemaining = Math.max(0, world.hurtRemaining - dt)
  for (const enemy of world.enemies) {
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt)
    const definition = ENEMY_DEFINITIONS[enemy.kind]
    let goal = pursuitTarget(enemy, world.player, world.obstacles, definition.radius)
    if (enemy.kind === 'ranged') {
      const range = distance(enemy, world.player)
      const blocked = world.obstacles.some((box) => segmentBox(enemy, world.player, box, RANGED.projectileRadius) !== null)
      if (enemy.attack) goal = enemy
      else if (range < RANGED.retreatRange) goal = { x: enemy.x + enemy.x - world.player.x, z: enemy.z + enemy.z - world.player.z }
      else if (range <= RANGED.preferredRange && !blocked) goal = enemy
    }
    const length = distance(enemy, goal)
    const speed = Math.min(definition.speed * dt, length)
    moveCircle(enemy, (length ? (goal.x - enemy.x) / length * speed : 0) + enemy.knockback.x * dt, (length ? (goal.z - enemy.z) / length * speed : 0) + enemy.knockback.z * dt, definition.radius, world.obstacles)
    enemy.knockback.x *= Math.exp(-10 * dt)
    enemy.knockback.z *= Math.exp(-10 * dt)
    // A player can now cross several camera views before an old group catches up.
    // Remove only a group that stayed well beyond combat reach; this is neither a
    // kill nor an XP source, and stops old enemies occupying the live cap forever.
    enemy.strandedRemaining = distance(enemy, world.player) > STRANDED_DISTANCE
      ? enemy.strandedRemaining - dt
      : STRANDED_DELAY
  }
  world.enemies = world.enemies.filter((enemy) => enemy.strandedRemaining > 0)
  separateEnemies(world)
  for (const enemy of world.enemies) {
    if (enemy.kind === 'pursuer' && distance(enemy, world.player) <= PURSUER.radius + PLAYER_RADIUS) damagePlayer(world, PURSUER.damage)
  }
  stepSpawning(world, dt)
}
