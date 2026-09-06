import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'
import type { Simulation } from '../game/core/Simulation'
import { DASH } from '../game/data/dash'

/** Ground trail and invulnerability ring exist for exactly the dash interval. */
export function DashTrail({ simulation }: { simulation: Simulation }) {
  const stripe = useRef<Mesh>(null)
  const ring = useRef<Mesh>(null)
  useFrame(() => {
    const world = simulation.world
    const dashing = world.combat && world.dash.remaining > 0
    if (stripe.current) {
      stripe.current.visible = dashing
      if (dashing) {
        const dx = world.player.x - world.dash.origin.x
        const dz = world.player.z - world.dash.origin.z
        const length = Math.hypot(dx, dz)
        stripe.current.position.set((world.player.x + world.dash.origin.x) / 2, 0.05, (world.player.z + world.dash.origin.z) / 2)
        stripe.current.rotation.set(0, Math.atan2(dx, dz), 0)
        stripe.current.scale.set(1, 1, Math.max(length, 0.001))
        const material = stripe.current.material as { opacity: number }
        material.opacity = 0.5 * (world.dash.remaining / DASH.duration)
      }
    }
    if (ring.current) {
      ring.current.visible = dashing
      if (dashing) ring.current.position.set(world.player.x, 0.06, world.player.z)
    }
  })
  return <>
    <mesh ref={stripe} visible={false}>
      <boxGeometry args={[0.5, 0.02, 1]} />
      <meshBasicMaterial color="#9fe8c9" transparent opacity={0.5} depthWrite={false} />
    </mesh>
    <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.46, 0.62, 32]} />
      <meshBasicMaterial color="#c8ffe0" transparent opacity={0.8} depthWrite={false} />
    </mesh>
  </>
}
