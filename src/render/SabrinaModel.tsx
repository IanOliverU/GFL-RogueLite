import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { Group, Mesh, MeshStandardMaterial } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { World } from '../game/core/world'
import type { Simulation } from '../game/core/Simulation'
import { CharacterPlaceholder } from './CharacterPlaceholder'

const SABRINA_GLB_URL = '/assets/characters/sabrina.glb'

/** Keeps a clean-checkout path: a missing local-only GLB falls back to planes. */
class SabrinaLoadBoundary extends Component<{ children: ReactNode; color: string }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) return <CharacterPlaceholder color={this.props.color} />
    return this.props.children
  }
}

function SabrinaDoll({ simulation }: { simulation: Simulation }) {
  const gltf = useLoader(GLTFLoader, SABRINA_GLB_URL)
  const yaw = useRef<Group>(null)
  const pitch = useRef<Group>(null)
  const flash = useRef<Mesh>(null)
  const anim = useRef({ phase: 0, recoil: 0, fall: 0, volleys: -1, lastX: 0, lastZ: 0, started: false, lastWorld: null as World | null })

  const { scene, materials } = useMemo(() => {
    const clone = gltf.scene.clone(true)
    const owned: MeshStandardMaterial[] = []
    clone.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true
        child.receiveShadow = false
        const source = child.material
        const copy = (Array.isArray(source) ? source[0] : source) as MeshStandardMaterial
        const own = copy.clone()
        owned.push(own)
        child.material = own
      }
    })
    return { scene: clone, materials: owned }
  }, [gltf])

  useFrame((_, delta) => {
    const yawGroup = yaw.current
    const pitchGroup = pitch.current
    if (!yawGroup || !pitchGroup) return
    const world = simulation.world
    const state = anim.current
    // A fresh world object means a new run: reset transient animation state.
    if (!state.started || state.lastWorld !== world) {
      state.started = true
      state.lastWorld = world
      state.phase = 0
      state.recoil = 0
      state.fall = 0
      state.volleys = world.volleys
      state.lastX = world.player.x
      state.lastZ = world.player.z
    }
    const status = simulation.getStatus()
    const aimYaw = Math.atan2(world.aimDirection.x, world.aimDirection.z)
    yawGroup.rotation.y = aimYaw

    if (status === 'game_over') {
      // Tip over backward around the feet anchor; wall-clock driven so the
      // fall completes even though the simulation clock is frozen.
      state.fall = Math.min(1, state.fall + Math.min(delta, 0.05) * 3)
    } else {
      state.fall = 0
    }
    const fallen = state.fall

    if (status === 'playing') {
      const dx = world.player.x - state.lastX
      const dz = world.player.z - state.lastZ
      const distance = Math.hypot(dx, dz)
      state.lastX = world.player.x
      state.lastZ = world.player.z
      state.phase += distance * 4.2 + delta * 1.6
      if (world.volleys !== state.volleys) {
        state.volleys = world.volleys
        state.recoil = 1
      }
      state.recoil = Math.max(0, state.recoil - delta * 7)
    }

    // Travel-driven bob plus idle breath. Both freeze with the simulation
    // because travel stops and volleys stop changing.
    const bob = (1 - fallen) * (Math.abs(Math.sin(state.phase)) * 0.035 + Math.sin(world.elapsed * 2.1) * 0.008)
    pitchGroup.position.y = bob
    pitchGroup.position.z = -state.recoil * 0.09 * (1 - fallen)
    const lean = world.dash.remaining > 0 && status === 'playing' ? 0.22 : 0
    pitchGroup.rotation.x = -fallen * Math.PI * 0.46 + lean * (1 - fallen)

    const flashing = world.hurtRemaining > 0 && fallen < 1
    for (const material of materials) {
      material.emissive.set(flashing ? '#a01313' : '#000000')
      material.emissiveIntensity = flashing ? 0.85 : 0
    }
    if (flash.current) {
      flash.current.visible = state.recoil > 0.55 && fallen < 0.5 && status === 'playing'
      const s = 0.16 + (1 - state.recoil) * 0.1
      flash.current.scale.set(s, s, s)
    }
  })

  return <group ref={yaw}>
    <group ref={pitch}>
      <primitive object={scene} />
      {/* Procedural sidearm: the download includes no weapon, so the existing
          separately-aimed-gun architecture carries it. It yaws with the body
          and never affects projectile semantics. */}
      <mesh position={[0.3, 1.32, 0.35]}>
        <boxGeometry args={[0.09, 0.15, 0.62]} /><meshStandardMaterial color="#23282b" roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[0.3, 1.36, 0.72]}>
        <boxGeometry args={[0.05, 0.07, 0.18]} /><meshStandardMaterial color="#3a4145" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh ref={flash} position={[0.3, 1.36, 0.86]} visible={false}>
        <sphereGeometry args={[1, 12, 8]} /><meshBasicMaterial color="#ffd77a" />
      </mesh>
    </group>
  </group>
}

export function SabrinaVisual({ simulation, color }: { simulation: Simulation; color: string }) {
  // Probe first: the preview/dev servers answer missing assets with the SPA
  // fallback page (HTTP 200), so status alone cannot prove the GLB exists.
  // A HEAD check on the content type resolves without downloading anything,
  // and a missing file never reaches the loader (no unhandled rejection).
  // The boundary below remains for corrupt-file failures.
  const [available, setAvailable] = useState<boolean | null>(null)
  useEffect(() => {
    let live = true
    fetch(SABRINA_GLB_URL, { method: 'HEAD' })
      .then((response) => {
        if (!live) return
        const kind = response.headers.get('content-type') ?? ''
        setAvailable(response.ok && (kind.includes('gltf') || kind.includes('octet-stream')))
      })
      .catch(() => { if (live) setAvailable(false) })
    return () => { live = false }
  }, [])
  if (available !== true) return <CharacterPlaceholder color={color} />
  return <SabrinaLoadBoundary color={color}>
    <Suspense fallback={<CharacterPlaceholder color={color} />}>
      <SabrinaDoll simulation={simulation} />
    </Suspense>
  </SabrinaLoadBoundary>
}
