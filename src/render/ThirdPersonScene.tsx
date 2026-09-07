import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { DirectionalLight, Group, Object3D, PerspectiveCamera, Vector3 } from 'three'
import type { Simulation } from '../game/core/Simulation'
import type { World } from '../game/core/world'
import { CHARACTERS } from '../game/data/characters'
import { THIRDPERSON_HEIGHTS } from '../game/data/arena'
import {
  THIRD_PERSON, collideCamera, followFactor, orbitForward, orbitOffset,
} from '../game/data/thirdPerson'
import { intersectGround } from '../game/systems/targeting'
import { bindThirdPersonInput, type ThirdPersonOrbit } from '../platform/thirdPersonInput'
import { ThirdPersonArena } from './ThirdPersonArena'
import { ThirdPersonDoll } from './ThirdPersonDoll'
import { CombatVisuals } from './CombatVisuals'
import { DashTrail } from './DashTrail'

const aimOrigin = new Vector3()
const aimDirection = new Vector3()

function ThirdPersonSun({ simulation }: { simulation: Simulation }) {
  const light = useRef<DirectionalLight>(null)
  const target = useRef<Object3D>(null)
  useFrame(() => {
    const x = simulation.world.player.x
    const z = simulation.world.player.z
    if (light.current) light.current.position.set(x - 14, 24, z + 12)
    if (target.current) {
      target.current.position.set(x, 0, z)
      target.current.updateMatrixWorld()
      if (light.current) light.current.target = target.current
    }
  })
  return <>
    <object3D ref={target} />
    <directionalLight ref={light} castShadow position={[-14, 24, 12]} intensity={2.25} color="#ffe8c9" shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-near={1} shadow-camera-far={120} shadow-bias={-0.0005} shadow-normalBias={0.8} />
  </>
}

export function ThirdPersonScene({ simulation, orbit, onLockChange, onLockError }: {
  simulation: Simulation
  orbit: ThirdPersonOrbit
  onLockChange: (locked: boolean) => void
  onLockError: (message: string) => void
}) {
  const { gl } = useThree()
  const character = useRef<Group>(null)
  const frameTimes = useRef<number[]>([])
  const cameraState = useRef({ position: new Vector3(), target: new Vector3(), snapped: false, lastWorld: null as World | null })
  const inspect = new URLSearchParams(window.location.search).has('inspect')
  useEffect(() => bindThirdPersonInput(simulation, gl.domElement, orbit, { onLockChange, onLockError }), [simulation, gl, orbit, onLockChange, onLockError])

  // Leaving active play releases a held pointer lock (pause, level-up, death).
  const status = simulation.getStatus()
  useEffect(() => {
    if (status !== 'playing' && document.pointerLockElement) document.exitPointerLock()
  }, [status])

  useFrame(({ camera }, delta) => {
    if (!(camera instanceof PerspectiveCamera)) return
    const world = simulation.world
    if (cameraState.current.lastWorld !== world) {
      cameraState.current.lastWorld = world
      cameraState.current.snapped = false
    }
    const state = cameraState.current
    state.target.set(world.player.x, THIRD_PERSON.targetHeight, world.player.z)
    const offset = orbitOffset(orbit.yaw, orbit.pitch, THIRD_PERSON.distance)
    const desired = {
      x: state.target.x + offset.x,
      y: state.target.y + offset.y,
      z: state.target.z + offset.z,
    }
    const clamped = collideCamera(
      { x: state.target.x, y: state.target.y, z: state.target.z },
      desired, world.obstacles, THIRDPERSON_HEIGHTS,
    )
    if (!state.snapped) {
      state.position.set(clamped.x, clamped.y, clamped.z)
      state.snapped = true
    } else {
      const k = followFactor(delta)
      state.position.x += (clamped.x - state.position.x) * k
      state.position.y += (clamped.y - state.position.y) * k
      state.position.z += (clamped.z - state.position.z) * k
    }
    camera.position.copy(state.position)
    camera.lookAt(state.target)
    camera.updateMatrixWorld(true)

    // Centered-crosshair aim: camera ray through screen center onto the
    // ground plane, with a distant forward fallback. The simulation resolves
    // the muzzle path and owns the firing direction.
    aimOrigin.copy(camera.position)
    aimDirection.copy(state.target).sub(camera.position).normalize()
    const ground = intersectGround(
      { x: aimOrigin.x, y: aimOrigin.y, z: aimOrigin.z },
      { x: aimDirection.x, y: aimDirection.y, z: aimDirection.z },
    )
    const forward = orbitForward(orbit.yaw)
    const aimPoint = ground ?? {
      x: world.player.x + forward.x * THIRD_PERSON.maxAimDistance,
      z: world.player.z + forward.z * THIRD_PERSON.maxAimDistance,
    }
    simulation.advance(delta, () => aimPoint, orbit.yaw)

    character.current?.position.set(world.player.x, 0, world.player.z)

    if (inspect) {
      const samples = frameTimes.current
      samples.push(delta * 1000)
      if (samples.length > 120) samples.shift()
      const sorted = [...samples].sort((a, b) => a - b)
      gl.domElement.dataset.playground = JSON.stringify({
        ...world, status: simulation.getStatus(), held: [...simulation.held],
        camera: camera.position.toArray(),
        render: {
          calls: gl.info.render.calls,
          triangles: gl.info.render.triangles,
          geometries: gl.info.memory.geometries,
          textures: gl.info.memory.textures,
          frameMs: {
            average: samples.reduce((sum, value) => sum + value, 0) / Math.max(1, samples.length),
            p95: sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] ?? 0,
            maximum: sorted.at(-1) ?? 0,
            samples: samples.length,
          },
          softwareRenderer: true,
        },
        thirdperson: {
          yaw: orbit.yaw,
          pitch: orbit.pitch,
          locked: document.pointerLockElement === gl.domElement,
          fireHeld: simulation.fireHeld,
          aimTarget: world.aimTarget,
        },
      })
    }
  }, -1)

  return <>
    <color attach="background" args={['#1d262b']} />
    <ambientLight intensity={0.58} />
    <hemisphereLight args={['#d7d8cf', '#28393b', 0.82]} />
    <ThirdPersonSun simulation={simulation} />
    <ThirdPersonArena />
    <group ref={character} key={simulation.world.dollId}>
      <ThirdPersonDoll simulation={simulation} dollId={simulation.world.dollId} color={CHARACTERS[simulation.world.dollId].color} />
    </group>
    <CombatVisuals simulation={simulation} bulletHeight={1.0} />
    <DashTrail simulation={simulation} />
  </>
}
