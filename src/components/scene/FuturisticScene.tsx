import { Float, Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, Mesh } from 'three';

export type SceneQuality = 'cinematic' | 'balanced' | 'light';

interface FuturisticSceneProps {
  quality: SceneQuality;
  isMobile: boolean;
}

interface QualityConfig {
  sparklesCount: number;
  sparklesSize: number;
  icosahedronDetail: number;
  ringCount: number;
}

const QUALITY_CONFIG: Record<SceneQuality, QualityConfig> = {
  cinematic: {
    sparklesCount: 280,
    sparklesSize: 2.2,
    icosahedronDetail: 5,
    ringCount: 3,
  },
  balanced: {
    sparklesCount: 180,
    sparklesSize: 1.6,
    icosahedronDetail: 4,
    ringCount: 2,
  },
  light: {
    sparklesCount: 110,
    sparklesSize: 1.2,
    icosahedronDetail: 3,
    ringCount: 1,
  },
};

function OrbitingRings({
  count,
  scale,
  motionRange,
}: {
  count: number;
  scale: number;
  motionRange: number;
}) {
  const groups = useRef<Group[]>([]);

  useFrame((state, delta) => {
    groups.current.forEach((group, index) => {
      if (!group) {
        return;
      }

      const direction = index % 2 === 0 ? 1 : -1;
      group.rotation.y += delta * 0.26 * direction;
      group.rotation.x += delta * 0.12 * direction;
      group.position.x = Math.sin(state.clock.elapsedTime * (0.3 + index * 0.1)) * motionRange;
    });
  });

  return (
    <>
      {new Array(count).fill(null).map((_, index) => (
        <group
          key={`ring-${index}`}
          ref={(element) => {
            if (element) {
              groups.current[index] = element;
            }
          }}
          rotation={[Math.PI / (2.2 + index), index * 0.7, Math.PI / 4]}
        >
          <mesh>
            <torusGeometry args={[(1.9 + index * 0.4) * scale, 0.03 * scale, 28, 220]} />
            <meshStandardMaterial
              color={index % 2 === 0 ? '#58c4ff' : '#1affb5'}
              emissive={index % 2 === 0 ? '#173f7a' : '#0a5a4d'}
              emissiveIntensity={0.8}
              roughness={0.25}
              metalness={0.7}
              transparent
              opacity={0.65}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

export default function FuturisticScene({ quality, isMobile }: FuturisticSceneProps) {
  const coreRef = useRef<Mesh>(null);
  const haloRef = useRef<Mesh>(null);
  const config = QUALITY_CONFIG[quality];
  const sceneScale = isMobile ? 0.72 : 1;
  const pointerScale = isMobile ? 0.62 : 1;
  const sparklesScale: [number, number, number] = isMobile ? [8, 6, 6] : [12, 8, 8];

  const sparklesColor = useMemo(() => {
    if (quality === 'cinematic') {
      return '#57d0ff';
    }

    if (quality === 'balanced') {
      return '#3eb8ef';
    }

    return '#2ea3d5';
  }, [quality]);

  useFrame((state, delta) => {
    const core = coreRef.current;
    const halo = haloRef.current;

    if (core) {
      core.rotation.x += delta * 0.2;
      core.rotation.y += delta * 0.35;

      const pointerX = state.pointer.x * 0.45 * pointerScale;
      const pointerY = state.pointer.y * 0.2 * pointerScale;
      core.position.x += (pointerX - core.position.x) * 0.04;
      core.position.y += (pointerY - core.position.y) * 0.04;
    }

    if (halo) {
      halo.rotation.z -= delta * 0.3;
      halo.rotation.x += delta * 0.15;
    }
  });

  return (
    <>
      <color attach="background" args={['#05070c']} />
      <fog attach="fog" args={['#05070c', 8, 18]} />

      <ambientLight intensity={0.4} />
      <hemisphereLight intensity={0.7} color="#81d4ff" groundColor="#02030c" />
      <pointLight position={[4, 3, 3]} intensity={35} color="#4dd4ff" />
      <pointLight position={[-3, -2, 4]} intensity={20} color="#00f7b5" />

      <group position={[0, isMobile ? -0.1 : 0.05, 0]} scale={sceneScale}>
        <Float speed={1.2} rotationIntensity={0.45} floatIntensity={0.8}>
          <mesh ref={coreRef} castShadow>
            <icosahedronGeometry args={[1.2, config.icosahedronDetail]} />
            <meshStandardMaterial
              color="#77d6ff"
              emissive="#0f4f9b"
              emissiveIntensity={1.1}
              roughness={0.22}
              metalness={0.78}
              wireframe={quality === 'light'}
            />
          </mesh>
        </Float>

        <mesh ref={haloRef} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[2.35, 0.08, 20, 180]} />
          <meshStandardMaterial
            color="#b7f0ff"
            emissive="#166f9f"
            emissiveIntensity={0.7}
            roughness={0.2}
            metalness={0.9}
            transparent
            opacity={0.7}
          />
        </mesh>

        <OrbitingRings
          count={config.ringCount}
          scale={isMobile ? 0.78 : 1}
          motionRange={isMobile ? 0.16 : 0.25}
        />
      </group>

      <Sparkles
        count={config.sparklesCount}
        size={config.sparklesSize}
        color={sparklesColor}
        speed={0.35}
        scale={sparklesScale}
        noise={2.2}
      />
    </>
  );
}
