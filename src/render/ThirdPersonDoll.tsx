import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import {
  AnimationAction, AnimationMixer, Group, LoopRepeat, Mesh, MeshStandardMaterial, Object3D, Vector3,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { AnimationUtils } from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import type { World } from '../game/core/world'
import type { Simulation } from '../game/core/Simulation'
import type { CharacterId } from '../game/data/characters'
import { LegacyPlaceholder } from './CharacterPlaceholder'

/** Animated exports for the third-person experiment (local-only, skinned). */
const THIRD_PERSON_GLB_URLS: Partial<Record<CharacterId, string>> = {
  sabrina: '/assets/characters/sabrina_tp.glb',
  'mosin-nagant': '/assets/characters/mosin-nagant_tp.glb',
  qiongjiu: '/assets/characters/qiongjiu_tp.glb',
}

class ThirdPersonLoadBoundary extends Component<{ children: ReactNode; color: string }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) return <LegacyPlaceholder color={this.props.color} />
    return this.props.children
  }
}

const flashPosition = new Vector3()

function ThirdPersonDollInner({ simulation, glbUrl }: { simulation: Simulation; glbUrl: string }) {
  const gltf = useLoader(GLTFLoader, glbUrl)
  const yaw = useRef<Group>(null)
  const kick = useRef<Group>(null)
  const flash = useRef<Mesh>(null)
  const anim = useRef({
    mixer: null as AnimationMixer | null,
    idle: null as AnimationAction | null,
    walk: null as AnimationAction | null,
    current: null as AnimationAction | null,
    started: false,
    lastWorld: null as World | null,
    lastX: 0,
    lastZ: 0,
    speed: 0,
    moving: false,
    volleys: -1,
    flashTimer: 0,
    kickAmount: 0,
    fall: 0,
  })

  const { scene, materials, muzzle } = useMemo(() => {
    // Skeleton-aware clone preserves skin bindings across mounts.
    const clone = cloneSkinned(gltf.scene)
    const owned: MeshStandardMaterial[] = []
    let foundMuzzle: Object3D | null = null
    clone.traverse((child: Object3D) => {
      if (child instanceof Mesh) {
        child.castShadow = true
        child.receiveShadow = false
        child.frustumCulled = false
        const source = child.material
        const copy = (Array.isArray(source) ? source[0] : source) as MeshStandardMaterial
        if (copy && 'emissive' in copy) {
          const own = copy.clone()
          owned.push(own)
          child.material = own
        }
      }
      if (child.name === 'Muzzle' && !foundMuzzle) foundMuzzle = child
    })
    return { scene: clone, materials: owned, muzzle: foundMuzzle as Object3D | null }
  }, [gltf])

  useEffect(() => {
    const state = anim.current
    const full = gltf.animations.find((clip) => clip.name === 'tp_full') ?? gltf.animations[0]
    if (!full) return
    const mixer = new AnimationMixer(scene)
    // One baked clip; split into loopable idle (frames 1-48) and walk (49-72).
    const idleClip = AnimationUtils.subclip(full, 'tp_idle', 1, 48, 24)
    const walkClip = AnimationUtils.subclip(full, 'tp_walk', 49, 72, 24)
    const idle = mixer.clipAction(idleClip)
    const walk = mixer.clipAction(walkClip)
    idle.setLoop(LoopRepeat, Infinity)
    walk.setLoop(LoopRepeat, Infinity)
    idle.play()
    state.mixer = mixer
    state.idle = idle
    state.walk = walk
    state.current = idle
    state.started = false
    return () => {
      mixer.stopAllAction()
      mixer.uncacheRoot(scene)
      state.mixer = null
      state.idle = null
      state.walk = null
      state.current = null
    }
  }, [gltf, scene])

  useFrame((_, rawDelta) => {
    const yawGroup = yaw.current
    const kickGroup = kick.current
    if (!yawGroup || !kickGroup) return
    const delta = Math.min(rawDelta, 0.05)
    const world = simulation.world
    const status = simulation.getStatus()
    const state = anim.current
    if (!state.started || state.lastWorld !== world) {
      state.started = true
      state.lastWorld = world
      state.lastX = world.player.x
      state.lastZ = world.player.z
      state.speed = 0
      state.moving = false
      state.volleys = world.volleys
      state.flashTimer = 0
      state.kickAmount = 0
      state.fall = 0
      if (state.mixer && state.idle && state.current !== state.idle) {
        state.current?.fadeOut(0.1)
        state.idle.reset().fadeIn(0.1).play()
        state.current = state.idle
      }
    }

    const aimYaw = Math.atan2(world.aimDirection.x, world.aimDirection.z)
    yawGroup.rotation.y = aimYaw

    if (status === 'game_over') {
      state.fall = Math.min(1, state.fall + Math.min(delta, 0.05) * 3)
    } else {
      state.fall = 0
    }

    if (status === 'playing') {
      const dx = world.player.x - state.lastX
      const dz = world.player.z - state.lastZ
      state.lastX = world.player.x
      state.lastZ = world.player.z
      const instant = delta > 1e-6 ? Math.hypot(dx, dz) / delta : 0
      state.speed += (instant - state.speed) * Math.min(1, delta * 10)
      const moving = state.speed > 1.0
      if (moving !== state.moving) {
        state.moving = moving
        const to = moving ? state.walk : state.idle
        if (state.current && to && state.current !== to) {
          state.current.crossFadeTo(to, 0.25)
          state.current = to
        }
      }
      if (world.volleys !== state.volleys) {
        state.volleys = world.volleys
        state.flashTimer = 0.07
        state.kickAmount = 1
      }
      state.flashTimer = Math.max(0, state.flashTimer - delta)
      state.kickAmount = Math.max(0, state.kickAmount - delta * 7)
      state.mixer?.update(delta)
    }

    kickGroup.rotation.x = -state.fall * Math.PI * 0.46
      + (world.dash.remaining > 0 && status === 'playing' ? 0.22 : 0)
      + state.kickAmount * 0.06 * (1 - state.fall)

    const flashing = world.hurtRemaining > 0 && state.fall < 1
    for (const material of materials) {
      material.emissive.set(flashing ? '#a01313' : '#000000')
      material.emissiveIntensity = flashing ? 0.85 : 0
    }
    if (flash.current) {
      const show = state.flashTimer > 0 && state.fall < 0.5 && status === 'playing'
      flash.current.visible = show
      if (show && muzzle) {
        muzzle.getWorldPosition(flashPosition)
        flash.current.position.copy(yawGroup.worldToLocal(flashPosition.clone()))
      }
    }
  })

  return <group ref={yaw}>
    <group ref={kick}>
      <primitive object={scene} />
      <mesh ref={flash} visible={false}>
        <sphereGeometry args={[0.09, 10, 8]} /><meshBasicMaterial color="#ffd77a" />
      </mesh>
    </group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
      <ringGeometry args={[0.4, 0.46, 32]} /><meshBasicMaterial color="#b8efce" />
    </mesh>
  </group>
}

export function ThirdPersonDoll({ simulation, dollId, color }: {
  simulation: Simulation
  dollId: CharacterId
  color: string
}) {
  const glbUrl = THIRD_PERSON_GLB_URLS[dollId]
  const [available, setAvailable] = useState<boolean | null>(null)
  useEffect(() => {
    if (!glbUrl) {
      setAvailable(false)
      return
    }
    let live = true
    fetch(glbUrl, { method: 'HEAD' })
      .then((response) => {
        if (!live) return
        const kind = response.headers.get('content-type') ?? ''
        setAvailable(response.ok && (kind.includes('gltf') || kind.includes('octet-stream')))
      })
      .catch(() => { if (live) setAvailable(false) })
    return () => { live = false }
  }, [glbUrl])
  if (!glbUrl || available !== true) return <LegacyPlaceholder color={color} />
  return <ThirdPersonLoadBoundary color={color}>
    <Suspense fallback={<LegacyPlaceholder color={color} />}>
      <ThirdPersonDollInner simulation={simulation} glbUrl={glbUrl} />
    </Suspense>
  </ThirdPersonLoadBoundary>
}
