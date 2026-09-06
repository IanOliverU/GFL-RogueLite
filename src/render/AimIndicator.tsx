import type { RefObject } from 'react'
import type { Group, Mesh } from 'three'

export function AimIndicator({ directionRef, targetRef }: { directionRef: RefObject<Group | null>; targetRef: RefObject<Mesh | null> }) {
  return <>
    <group ref={directionRef}>
      <mesh position={[0, 0.045, 0.95]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.055, 1.1]} /><meshBasicMaterial color="#f5ce7a" />
      </mesh>
      <mesh position={[0, 0.05, 1.7]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        <circleGeometry args={[0.19, 3]} /><meshBasicMaterial color="#f5ce7a" />
      </mesh>
    </group>
    <mesh ref={targetRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.22, 0.27, 32]} /><meshBasicMaterial color="#ffe0a0" depthTest={false} />
    </mesh>
  </>
}
