import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, InstancedMesh, Object3D } from 'three'
import type { Simulation } from '../game/core/Simulation'
import { MAX_ENEMIES, MAX_PROJECTILES, PURSUER } from '../game/data/arena'

const transform = new Object3D()
const color = new Color()

/** Fixed-capacity batches consume simulation entities without per-entity React state. */
export function CombatVisuals({ simulation }: { simulation: Simulation }) {
  const enemies = useRef<InstancedMesh>(null)
  const bullets = useRef<InstancedMesh>(null)
  const health = useRef<InstancedMesh>(null)
  useFrame(() => {
    const world = simulation.world
    if (enemies.current && health.current) {
      enemies.current.count = world.enemies.length
      health.current.count = world.enemies.length
      world.enemies.forEach((enemy, index) => {
        transform.position.set(enemy.x, 0.55, enemy.z)
        transform.rotation.set(0, 0, 0)
        transform.scale.set(1, 1, 1)
        transform.updateMatrix()
        enemies.current!.setMatrixAt(index, transform.matrix)
        enemies.current!.setColorAt(index, color.set(enemy.hitFlash > 0 ? '#fff1c0' : '#d8756d'))
        transform.position.set(enemy.x, 1.3, enemy.z)
        transform.scale.set(Math.max(0, enemy.health / PURSUER.health), 1, 1)
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
  </>
}
