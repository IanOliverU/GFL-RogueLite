import { ARENA_HALF_SIZE } from '../game/core/world'
import type { Obstacle } from '../game/data/arena'

export function Arena({ obstacles = [] }: { obstacles?: readonly Obstacle[] }) {
  const size = ARENA_HALF_SIZE * 2
  return <group>
    {obstacles.map((obstacle) => <mesh key={obstacle.id} position={[(obstacle.minX + obstacle.maxX) / 2, 0.4, (obstacle.minZ + obstacle.maxZ) / 2]}>
      <boxGeometry args={[obstacle.maxX - obstacle.minX, 0.8, obstacle.maxZ - obstacle.minZ]} /><meshStandardMaterial color="#7d8b87" />
    </mesh>)}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]}>
      <planeGeometry args={[150, 150]} /><meshBasicMaterial color="#152328" />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size, size]} /><meshStandardMaterial color="#35494b" roughness={1} />
    </mesh>
    <gridHelper args={[size, size, '#79928a', '#49615e']} position={[0, 0.015, 0]} />
    {[-1, 1].map((side) => <group key={side}>
      <mesh position={[side * (ARENA_HALF_SIZE + 0.15), 0.18, 0]}>
        <boxGeometry args={[0.3, 0.36, size + 0.6]} /><meshStandardMaterial color="#c5aa69" />
      </mesh>
      <mesh position={[0, 0.18, side * (ARENA_HALF_SIZE + 0.15)]}>
        <boxGeometry args={[size, 0.36, 0.3]} /><meshStandardMaterial color="#c5aa69" />
      </mesh>
    </group>)}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <ringGeometry args={[2.8, 2.84, 64]} /><meshBasicMaterial color="#87978a" />
    </mesh>
  </group>
}
