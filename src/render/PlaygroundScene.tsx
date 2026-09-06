import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, Mesh, OrthographicCamera, Vector3 } from 'three'
import type { Simulation } from '../game/core/Simulation'
import { updateAim } from '../game/systems/targeting'
import { bindBrowserInput } from '../platform/browserInput'
import { Arena } from './Arena'
import { CharacterPlaceholder } from './CharacterPlaceholder'
import { AimIndicator } from './AimIndicator'
import { projectCursor, updateCamera } from './cameraProjection'
import { CombatVisuals } from './CombatVisuals'
import { DashTrail } from './DashTrail'
import { CHARACTERS } from '../game/data/characters'

const screenPoint = new Vector3()

export function PlaygroundScene({ simulation }: { simulation: Simulation }) {
  const { gl } = useThree()
  const character = useRef<Group>(null)
  const direction = useRef<Group>(null)
  const target = useRef<Mesh>(null)
  const inspect = new URLSearchParams(window.location.search).has('inspect')
  useEffect(() => bindBrowserInput(simulation, gl.domElement), [simulation, gl])

  useFrame(({ camera }, delta) => {
    if (!(camera instanceof OrthographicCamera)) return
    const rect = gl.domElement.getBoundingClientRect()
    simulation.advance(delta, (player) => {
      updateCamera(camera, player, rect.width, rect.height)
      return simulation.pointer ? projectCursor(camera, simulation.pointer, rect) : null
    })
    const world = simulation.world
    updateCamera(camera, world.player, rect.width, rect.height)
    if (simulation.getStatus() === 'playing' && simulation.pointer) {
      updateAim(world, projectCursor(camera, simulation.pointer, rect))
    }
    character.current?.position.set(world.player.x, 0, world.player.z)
    if (direction.current) {
      direction.current.position.set(world.player.x, 0, world.player.z)
      direction.current.rotation.y = Math.atan2(world.aimDirection.x, world.aimDirection.z)
    }
    if (target.current) {
      target.current.visible = world.aimTarget !== null && simulation.pointer !== null && simulation.getStatus() === 'playing'
      if (world.aimTarget) target.current.position.set(world.aimTarget.x, 0.025, world.aimTarget.z)
    }
    // Opt-in, read-only diagnostics for repeatable browser checks; absent in normal play.
    if (inspect) {
      const point = world.aimTarget
      screenPoint.set(point?.x ?? 0, 0, point?.z ?? 0).project(camera)
      gl.domElement.dataset.playground = JSON.stringify({
        ...world, status: simulation.getStatus(), held: [...simulation.held],
        camera: camera.position.toArray(),
        targetScreen: { x: rect.left + (screenPoint.x + 1) * rect.width / 2, y: rect.top + (1 - screenPoint.y) * rect.height / 2 },
        enemiesScreen: world.enemies.map((enemy) => {
          screenPoint.set(enemy.x, 0, enemy.z).project(camera)
          return { id: enemy.id, x: rect.left + (screenPoint.x + 1) * rect.width / 2, y: rect.top + (1 - screenPoint.y) * rect.height / 2 }
        }),
      })
    }
  }, -1)

  return <>
    <color attach="background" args={['#152328']} />
    <ambientLight intensity={1.7} />
    <directionalLight position={[-6, 14, 8]} intensity={2} />
    <Arena obstacles={simulation.world.obstacles} />
    <group ref={character}><CharacterPlaceholder color={CHARACTERS[simulation.world.dollId].color} /></group>
    <AimIndicator directionRef={direction} targetRef={target} />
    <CombatVisuals simulation={simulation} />
    <DashTrail simulation={simulation} />
  </>
}
