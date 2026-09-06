import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, InstancedMesh, Object3D } from 'three'
import type { Simulation } from '../game/core/Simulation'
import { ENEMY_DEFINITIONS, MAX_ENEMIES, MAX_HOSTILE_PROJECTILES, MAX_PROJECTILES, PURSUER } from '../game/data/arena'
import { MAX_GEMS } from '../game/data/progression'
import { warningPath } from '../game/systems/rangedAttacks'

const transform = new Object3D()
const color = new Color()
const ENEMY_COLORS = { pursuer: '#d8756d', ranged: '#b487d2' } as const

/** Fixed-capacity batches consume simulation entities without per-entity React state. */
export function CombatVisuals({ simulation }: { simulation: Simulation }) {
  const enemies = useRef<InstancedMesh>(null)
  const bullets = useRef<InstancedMesh>(null)
  const hostile = useRef<InstancedMesh>(null)
  const health = useRef<InstancedMesh>(null)
  const warningCore = useRef<InstancedMesh>(null)
  const warningGlow = useRef<InstancedMesh>(null)
  const gems = useRef<InstancedMesh>(null)
  useFrame(() => {
    const world = simulation.world
    if (enemies.current && health.current) {
      enemies.current.count = world.enemies.length
      health.current.count = world.enemies.length
      world.enemies.forEach((enemy, index) => {
        const definition = ENEMY_DEFINITIONS[enemy.kind]
        const scale = definition.radius / PURSUER.radius
        transform.position.set(enemy.x, 0.55, enemy.z)
        transform.rotation.set(0, 0, 0)
        transform.scale.set(scale, 1, scale)
        transform.updateMatrix()
        enemies.current!.setMatrixAt(index, transform.matrix)
        enemies.current!.setColorAt(index, color.set(
          enemy.hitFlash > 0 ? '#fff1c0'
            : enemy.attack ? '#ffb08e'
              : ENEMY_COLORS[enemy.kind],
        ))
        transform.position.set(enemy.x, 1.3, enemy.z)
        transform.scale.set(Math.max(0, enemy.health / definition.health), 1, 1)
        transform.updateMatrix()
        health.current!.setMatrixAt(index, transform.matrix)
      })
      enemies.current.instanceMatrix.needsUpdate = true
      health.current.instanceMatrix.needsUpdate = true
      if (enemies.current.instanceColor) enemies.current.instanceColor.needsUpdate = true
    }
    if (bullets.current) {
      bullets.current.count = world.projectiles.length
      world.projectiles.forEach((projectile, index) => {
        transform.position.set(projectile.x, 0.12, projectile.z)
        transform.rotation.set(0, Math.atan2(projectile.direction.x, projectile.direction.z), 0)
        transform.scale.set(1, 1, projectile.maxHits > 1 ? 2 : 1)
        transform.updateMatrix()
        bullets.current!.setMatrixAt(index, transform.matrix)
      })
      bullets.current.instanceMatrix.needsUpdate = true
    }
    if (hostile.current) {
      hostile.current.count = world.hostileProjectiles.length
      world.hostileProjectiles.forEach((projectile, index) => {
        transform.position.set(projectile.x, 0.14, projectile.z)
        transform.rotation.set(0, 0, 0)
        transform.scale.set(1, 1, 1)
        transform.updateMatrix()
        hostile.current!.setMatrixAt(index, transform.matrix)
      })
      hostile.current.instanceMatrix.needsUpdate = true
    }
    if (gems.current) {
      gems.current.count = Math.min(world.gems.length, MAX_GEMS)
      world.gems.slice(0, MAX_GEMS).forEach((gem, index) => {
        transform.position.set(gem.x, 0.12, gem.z)
        transform.rotation.set(0, world.elapsed * 2 + index, 0)
        const scale = gem.value >= 4 ? 1.4 : 1
        transform.scale.set(scale, scale, scale)
        transform.updateMatrix()
        gems.current!.setMatrixAt(index, transform.matrix)
      })
      gems.current.instanceMatrix.needsUpdate = true
    }
    // Telegraph stripes mirror the real projectile path: locked direction, stopped by cover/perimeter.
    const warnings = world.enemies.filter((enemy) => enemy.attack && enemy.kind === 'ranged' && enemy.health > 0)
    for (const stripe of [warningCore, warningGlow]) {
      if (!stripe.current) continue
      stripe.current.count = warnings.length
      warnings.forEach((enemy, index) => {
        const path = warningPath(enemy, world.obstacles)
        const length = Math.hypot(path.end.x - enemy.x, path.end.z - enemy.z)
        transform.position.set((enemy.x + path.end.x) / 2, 0.04, (enemy.z + path.end.z) / 2)
        transform.rotation.set(0, Math.atan2(path.end.x - enemy.x, path.end.z - enemy.z), 0)
        transform.scale.set(1, 1, Math.max(length, 0.001))
        transform.updateMatrix()
        stripe.current!.setMatrixAt(index, transform.matrix)
      })
      stripe.current.instanceMatrix.needsUpdate = true
    }
  })
  return <>
    <instancedMesh ref={enemies} args={[undefined, undefined, MAX_ENEMIES]} frustumCulled={false}>
      <cylinderGeometry args={[PURSUER.radius, PURSUER.radius, 1.1, 6]} /><meshBasicMaterial />
    </instancedMesh>
    <instancedMesh ref={health} args={[undefined, undefined, MAX_ENEMIES]} frustumCulled={false}>
      <planeGeometry args={[0.85, 0.07]} /><meshBasicMaterial color="#ffa692" />
    </instancedMesh>
    <instancedMesh ref={bullets} args={[undefined, undefined, MAX_PROJECTILES]} frustumCulled={false}>
      <boxGeometry args={[0.07, 0.04, 0.3]} /><meshBasicMaterial color="#ffe6a6" />
    </instancedMesh>
    <instancedMesh ref={hostile} args={[undefined, undefined, MAX_HOSTILE_PROJECTILES]} frustumCulled={false}>
      <sphereGeometry args={[0.13, 10, 10]} /><meshBasicMaterial color="#ff8f5e" />
    </instancedMesh>
    <instancedMesh ref={gems} args={[undefined, undefined, MAX_GEMS]} frustumCulled={false}>
      <octahedronGeometry args={[0.14]} /><meshBasicMaterial color="#7fe3a8" />
    </instancedMesh>
    <instancedMesh ref={warningGlow} args={[undefined, undefined, MAX_ENEMIES]} frustumCulled={false}>
      <boxGeometry args={[0.4, 0.02, 1]} /><meshBasicMaterial color="#ff5d4d" transparent opacity={0.28} depthWrite={false} />
    </instancedMesh>
    <instancedMesh ref={warningCore} args={[undefined, undefined, MAX_ENEMIES]} frustumCulled={false}>
      <boxGeometry args={[0.12, 0.03, 1]} /><meshBasicMaterial color="#ff5d4d" transparent opacity={0.85} depthWrite={false} />
    </instancedMesh>
  </>
}
