import type { CharacterId } from '../game/data/characters'
import type { Simulation } from '../game/core/Simulation'
import { SabrinaVisual } from './SabrinaModel'

function GroundMarker() {
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
      <circleGeometry args={[0.4, 32]} /><meshBasicMaterial color="#101c20" transparent opacity={0.65} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
      <ringGeometry args={[0.4, 0.46, 32]} /><meshBasicMaterial color="#b8efce" />
    </mesh>
  </>
}

/** Upright XY planes: every piece is above the bottom-center foot origin. */
export function LegacyPlaceholder({ color = '#b0d7ca' }: { color?: string }) {
  return <group>
    <GroundMarker />
    <mesh position={[0, 1.15, 0]}>
      <planeGeometry args={[0.86, 1.35]} /><meshBasicMaterial color={color} />
    </mesh>
    <mesh position={[0, 1.95, 0.01]}>
      <circleGeometry args={[0.35, 8]} /><meshBasicMaterial color="#f4dcad" />
    </mesh>
    <mesh position={[0, 2.11, 0.02]}>
      <planeGeometry args={[0.74, 0.25]} /><meshBasicMaterial color="#d0dce0" />
    </mesh>
    <mesh position={[0, 1.53, 0.02]}>
      <planeGeometry args={[0.86, 0.14]} /><meshBasicMaterial color="#e5b666" />
    </mesh>
    {[-0.23, 0.23].map((x) => <mesh key={x} position={[x, 0.25, 0.01]}>
      <planeGeometry args={[0.28, 0.5]} /><meshBasicMaterial color="#213338" />
    </mesh>)}
  </group>
}

export function CharacterPlaceholder({ color = '#b0d7ca', dollId, simulation }: {
  color?: string
  dollId?: CharacterId
  simulation?: Simulation
}) {
  // Proven pipeline doll: real-time model with procedural placeholder motion.
  // Missing local-only GLB falls back to planes, so clean checkouts keep running.
  if (dollId === 'sabrina' && simulation) {
    return <group>
      <GroundMarker />
      <SabrinaVisual simulation={simulation} color={color} />
    </group>
  }
  return <LegacyPlaceholder color={color} />
}
