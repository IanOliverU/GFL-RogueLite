import { useMemo } from 'react'
import { MAP_HALF_DEPTH, MAP_HALF_WIDTH } from '../game/core/world'
import { THIRDPERSON_HEIGHTS, THIRDPERSON_OBSTACLES, type Obstacle } from '../game/data/arena'

/**
 * Compact outdoor control-test arena (blockout-grade, ?mode=thirdperson).
 * Explicitly NOT finished art: flat-shaded procedural masses sized from the
 * same footprints the simulation collides against, so solid looks always
 * match solid collision. Decorative elevation stays outside the walls.
 */

function RockWall({ box, height }: { box: Obstacle; height: number }) {
  const cx = (box.minX + box.maxX) / 2
  const cz = (box.minZ + box.maxZ) / 2
  const w = box.maxX - box.minX
  const d = box.maxZ - box.minZ
  return <group position={[cx, 0, cz]}>
    <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, height, d]} />
      <meshStandardMaterial color="#6b6259" roughness={0.95} flatShading />
    </mesh>
    <mesh position={[0, height + 0.12, 0]} castShadow>
      <boxGeometry args={[w + 0.3, 0.24, d + 0.3]} />
      <meshStandardMaterial color="#7d7469" roughness={0.95} flatShading />
    </mesh>
  </group>
}

function CrateStack({ box, height }: { box: Obstacle; height: number }) {
  const cx = (box.minX + box.maxX) / 2
  const cz = (box.minZ + box.maxZ) / 2
  return <group position={[cx, 0, cz]}>
    <mesh position={[-0.4, 0.55, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.1, 1.1, 1.1]} />
      <meshStandardMaterial color="#5c6247" roughness={0.9} flatShading />
    </mesh>
    <mesh position={[0.45, 0.45, 0.1]} castShadow receiveShadow>
      <boxGeometry args={[0.9, 0.9, 0.9]} />
      <meshStandardMaterial color="#686e50" roughness={0.9} flatShading />
    </mesh>
    <mesh position={[0, height - 0.25, -0.1]} castShadow>
      <boxGeometry args={[1.4, 0.5, 1.0]} />
      <meshStandardMaterial color="#4e543d" roughness={0.9} flatShading />
    </mesh>
  </group>
}

function CoverRock({ box, height }: { box: Obstacle; height: number }) {
  const cx = (box.minX + box.maxX) / 2
  const cz = (box.minZ + box.maxZ) / 2
  return <group position={[cx, 0, cz]}>
    <mesh position={[0, height * 0.32, 0]} castShadow receiveShadow>
      <dodecahedronGeometry args={[1.5, 0]} />
      <meshStandardMaterial color="#5e5b54" roughness={1} flatShading />
    </mesh>
    <mesh position={[0.5, height * 0.62, -0.2]} castShadow>
      <dodecahedronGeometry args={[0.9, 0]} />
      <meshStandardMaterial color="#6a675f" roughness={1} flatShading />
    </mesh>
  </group>
}

function Barrier({ box, height }: { box: Obstacle; height: number }) {
  const cx = (box.minX + box.maxX) / 2
  const cz = (box.minZ + box.maxZ) / 2
  const w = box.maxX - box.minX
  return <group position={[cx, 0, cz]}>
    <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, height, 0.55]} />
      <meshStandardMaterial color="#8a877e" roughness={0.9} flatShading />
    </mesh>
    <mesh position={[0, height + 0.03, 0]}>
      <boxGeometry args={[w * 0.7, 0.07, 0.57]} />
      <meshStandardMaterial color="#c98a2e" roughness={0.7} />
    </mesh>
  </group>
}

function BackdropRock({ x, z, s, h }: { x: number; z: number; s: number; h: number }) {
  return <mesh position={[x, h * 0.28, z]} rotation={[0.3, x, 0.1]} castShadow receiveShadow>
    <dodecahedronGeometry args={[s, 0]} />
    <meshStandardMaterial color="#4c4a45" roughness={1} flatShading />
  </mesh>
}

function Tower({ x, z }: { x: number; z: number }) {
  return <group position={[x, 0, z]}>
    <mesh position={[0, 4.5, 0]} castShadow>
      <boxGeometry args={[1.6, 9, 1.6]} />
      <meshStandardMaterial color="#33383b" roughness={0.8} metalness={0.4} flatShading />
    </mesh>
    <mesh position={[0, 8.2, 0]} castShadow>
      <boxGeometry args={[4.2, 0.7, 1.2]} />
      <meshStandardMaterial color="#3d4347" roughness={0.8} metalness={0.4} flatShading />
    </mesh>
    <mesh position={[1.8, 8.9, 0]}>
      <sphereGeometry args={[0.22, 10, 10]} />
      <meshBasicMaterial color="#ffb14e" />
    </mesh>
    <mesh position={[-1.8, 8.9, 0]}>
      <sphereGeometry args={[0.22, 10, 10]} />
      <meshBasicMaterial color="#ffb14e" />
    </mesh>
  </group>
}

const BACKDROP_ROCKS: ReadonlyArray<{ x: number; z: number; s: number; h: number }> = [
  { x: -28, z: -20, s: 3.4, h: 3.2 }, { x: 27, z: -24, s: 4.2, h: 3.8 },
  { x: -30, z: 14, s: 3.0, h: 2.8 }, { x: 29, z: 16, s: 3.8, h: 3.4 },
  { x: 0, z: -30, s: 4.6, h: 4.2 }, { x: -8, z: 30, s: 3.2, h: 3.0 },
  { x: 12, z: 30, s: 2.6, h: 2.4 },
]

export function ThirdPersonArena() {
  const covers = useMemo(() => THIRDPERSON_OBSTACLES.filter((o) => !o.id.startsWith('tp-wall')), [])
  const walls = useMemo(() => THIRDPERSON_OBSTACLES.filter((o) => o.id.startsWith('tp-wall')), [])
  return <group name="thirdperson-arena-blockout">
    {/* Outer apron: the 120 x 96 bounds never show void. */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.09, 0]} receiveShadow>
      <planeGeometry args={[MAP_HALF_WIDTH * 2 + 30, MAP_HALF_DEPTH * 2 + 30]} />
      <meshStandardMaterial color="#22282a" roughness={1} />
    </mesh>
    {/* Packed-earth combat disc with a worn rim. */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <circleGeometry args={[25, 48]} />
      <meshStandardMaterial color="#4a4438" roughness={1} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
      <circleGeometry args={[21, 48]} />
      <meshStandardMaterial color="#55503f" roughness={1} />
    </mesh>
    {walls.map((box) => <RockWall key={box.id} box={box} height={THIRDPERSON_HEIGHTS[box.id]} />)}
    {covers.map((box) => box.id === 'tp-crates'
      ? <CrateStack key={box.id} box={box} height={THIRDPERSON_HEIGHTS[box.id]} />
      : box.id === 'tp-rock'
        ? <CoverRock key={box.id} box={box} height={THIRDPERSON_HEIGHTS[box.id]} />
        : <Barrier key={box.id} box={box} height={THIRDPERSON_HEIGHTS[box.id]} />)}
    {BACKDROP_ROCKS.map((rock, index) => <BackdropRock key={index} {...rock} />)}
    <Tower x={-26} z={-22} />
    <Tower x={26} z={22} />
    {/* North pipe run outside the wall. */}
    <mesh position={[0, 1.1, -21]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.5, 0.5, 30, 12]} />
      <meshStandardMaterial color="#3a4045" roughness={0.7} metalness={0.5} flatShading />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
      <ringGeometry args={[2.75, 2.84, 64]} />
      <meshBasicMaterial color="#d1c39c" transparent opacity={0.72} />
    </mesh>
  </group>
}
