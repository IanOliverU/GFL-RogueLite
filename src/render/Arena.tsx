import { useLoader } from '@react-three/fiber'
import { useMemo } from 'react'
import { Mesh } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MAP_HALF_DEPTH, MAP_HALF_WIDTH } from '../game/core/world'
import { ENVIRONMENT_PROPS, type EnvironmentProp, type Obstacle } from '../game/data/arena'

const groundColor = '#6d6048'
const wornConcrete = '#756d5c'

const ENVIRONMENT_ASSET_URLS = {
  ground: '/assets/environment-kit/ENV_GroundConcrete_Module.glb',
  barricade: '/assets/environment-kit/ENV_ConcreteBarricade_Low.glb',
  fence: '/assets/environment-kit/ENV_FencePanel_Plated.glb',
  crate: '/assets/environment-kit/ENV_SupplyCrate.glb',
  barrel: '/assets/environment-kit/ENV_Barrel.glb',
  gatepost: '/assets/environment-kit/ENV_Gatepost.glb',
  debris: '/assets/environment-kit/ENV_DebrisSmall.glb',
} as const

type EnvironmentAsset = keyof typeof ENVIRONMENT_ASSET_URLS

function EnvironmentAssetModel({ asset, position, rotation = 0, scale = 1 }: {
  asset: EnvironmentAsset
  position: [number, number, number]
  rotation?: number
  scale?: number | [number, number, number]
}) {
  const gltf = useLoader(GLTFLoader, ENVIRONMENT_ASSET_URLS[asset])
  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true)
    clone.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return clone
  }, [gltf.scene])
  return <primitive object={scene} position={position} rotation={[0, rotation, 0]} scale={scale} />
}

function CheckpointProp({ prop }: { prop: EnvironmentProp }) {
  const scale = prop.scale ?? 1
  if (prop.kind === 'fence' || prop.kind === 'crate' || prop.kind === 'barrel' || prop.kind === 'gatepost' || prop.kind === 'debris') {
    return <EnvironmentAssetModel asset={prop.kind} position={[prop.x, 0, prop.z]} rotation={prop.rotation} scale={scale} />
  }
  if (prop.kind === 'rock') return <mesh position={[prop.x, 0.5 * scale, prop.z]} scale={scale} rotation={[0.1, 0.5, 0]} castShadow receiveShadow>
    <dodecahedronGeometry args={[0.8, 0]} /><meshStandardMaterial color="#514b3e" roughness={1} />
  </mesh>
  return <group position={[prop.x, 0, prop.z]} rotation={[0, prop.rotation ?? 0, 0]}>
    <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.5, 0.55]} /><meshBasicMaterial color="#a9822b" /></mesh>
    <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.15, 0.18]} /><meshBasicMaterial color="#252521" /></mesh>
  </group>
}

function CheckpointBarricades({ obstacles }: { obstacles: readonly Obstacle[] }) {
  return <>
    {obstacles.filter((obstacle) => obstacle.id.startsWith('checkpoint-barricade-')).map((obstacle) => {
      const width = obstacle.maxX - obstacle.minX
      const depth = obstacle.maxZ - obstacle.minZ
      const rotate = depth > width
      return <EnvironmentAssetModel
        key={obstacle.id}
        asset="barricade"
        position={[(obstacle.minX + obstacle.maxX) / 2, 0, (obstacle.minZ + obstacle.maxZ) / 2]}
        rotation={rotate ? Math.PI / 2 : 0}
        scale={rotate ? [depth / 3, 1, width / 0.55] : [width / 3, 1, depth / 0.55]}
      />
    })}
  </>
}

function BoundaryFence() {
  const width = MAP_HALF_WIDTH * 2, depth = MAP_HALF_DEPTH * 2
  return <group>
    {[-1, 1].map((side) => <group key={`x-${side}`} position={[side * (MAP_HALF_WIDTH + 0.3), 0, 0]}>
      <mesh position={[0, 0.65, 0]} castShadow><boxGeometry args={[0.6, 1.3, depth + 1]} /><meshStandardMaterial color="#343935" roughness={0.9} /></mesh>
      <mesh position={[-side * 0.32, 1.48, 0]}><boxGeometry args={[0.09, 0.12, depth + 1]} /><meshStandardMaterial color="#b08a35" /></mesh>
    </group>)}
    {[-1, 1].map((side) => <group key={`z-${side}`} position={[0, 0, side * (MAP_HALF_DEPTH + 0.3)]}>
      <mesh position={[0, 0.65, 0]} castShadow><boxGeometry args={[width + 1, 1.3, 0.6]} /><meshStandardMaterial color="#343935" roughness={0.9} /></mesh>
      <mesh position={[0, 1.48, -side * 0.32]}><boxGeometry args={[width + 1, 0.12, 0.09]} /><meshStandardMaterial color="#b08a35" /></mesh>
    </group>)}
  </group>
}

export function Arena({ obstacles = [] }: { obstacles?: readonly Obstacle[] }) {
  const width = MAP_HALF_WIDTH * 2, depth = MAP_HALF_DEPTH * 2
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.035, 0]} receiveShadow><planeGeometry args={[width + 24, depth + 24]} /><meshBasicMaterial color="#252b29" /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[width, depth]} /><meshStandardMaterial color={groundColor} roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, -8]} receiveShadow><planeGeometry args={[width - 4, 5.5]} /><meshStandardMaterial color={wornConcrete} roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[18, 0.008, 0]} receiveShadow><planeGeometry args={[6, depth - 5]} /><meshStandardMaterial color="#665f50" roughness={1} /></mesh>
    {[-42, -18, 6, 30, 48].map((x) => <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.012, -8]}><planeGeometry args={[0.32, 4.9]} /><meshBasicMaterial color="#b28a35" /></mesh>)}
    {obstacles.filter((obstacle) => !obstacle.id.startsWith('checkpoint-barricade-')).map((obstacle) => <mesh key={obstacle.id} position={[(obstacle.minX + obstacle.maxX) / 2, 0.48, (obstacle.minZ + obstacle.maxZ) / 2]} castShadow receiveShadow>
      <boxGeometry args={[obstacle.maxX - obstacle.minX, 0.96, obstacle.maxZ - obstacle.minZ]} /><meshStandardMaterial color="#77746a" roughness={0.96} />
    </mesh>)}
    <EnvironmentAssetModel asset="ground" position={[-18, 0, -17]} />
    <EnvironmentAssetModel asset="ground" position={[-18, 0, -11]} />
    <CheckpointBarricades obstacles={obstacles} />
    {ENVIRONMENT_PROPS.map((prop) => <CheckpointProp key={prop.id} prop={prop} />)}
    <BoundaryFence />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><ringGeometry args={[2.8, 2.84, 64]} /><meshBasicMaterial color="#b59d69" /></mesh>
  </group>
}
