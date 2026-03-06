import { useDetectGPU } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useState } from 'react';
import FuturisticScene, { type SceneQuality } from './FuturisticScene';

interface GpuResult {
  tier: number;
  isMobile?: boolean;
}

interface QualityProfile {
  mode: SceneQuality;
  dpr: [number, number];
  antialias: boolean;
  shadows: boolean;
}

interface CameraProfile {
  position: [number, number, number];
  fov: number;
}

function supportsWebGL2() {
  const canvas = document.createElement('canvas');
  return Boolean(canvas.getContext('webgl2'));
}

function resolveQuality(gpu: GpuResult | null, isMobileViewport: boolean, reducedMotion: boolean): QualityProfile {
  if (reducedMotion) {
    return { mode: 'light', dpr: [1, 1], antialias: false, shadows: false };
  }

  if (!gpu) {
    return { mode: 'balanced', dpr: [1, 1.5], antialias: true, shadows: false };
  }

  const mobile = gpu.isMobile ?? isMobileViewport;

  if (!mobile && gpu.tier >= 3) {
    return { mode: 'cinematic', dpr: [1, 2], antialias: true, shadows: true };
  }

  if (gpu.tier >= 2) {
    return { mode: 'balanced', dpr: [1, 1.5], antialias: true, shadows: false };
  }

  return { mode: 'light', dpr: [1, 1], antialias: false, shadows: false };
}

export function AdaptiveScene() {
  const rawGpu = useDetectGPU();
  const gpu =
    rawGpu && typeof rawGpu === 'object' && 'tier' in rawGpu ? (rawGpu as GpuResult) : null;
  const [webglReady, setWebglReady] = useState(true);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setWebglReady(supportsWebGL2());

    const viewportMediaQuery = window.matchMedia('(max-width: 920px)');
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const applyViewport = () => setIsMobileViewport(viewportMediaQuery.matches);
    const applyMotion = () => setReducedMotion(motionMediaQuery.matches);

    applyViewport();
    applyMotion();

    viewportMediaQuery.addEventListener('change', applyViewport);
    motionMediaQuery.addEventListener('change', applyMotion);

    return () => {
      viewportMediaQuery.removeEventListener('change', applyViewport);
      motionMediaQuery.removeEventListener('change', applyMotion);
    };
  }, []);

  const quality = useMemo(
    () => resolveQuality(gpu, isMobileViewport, reducedMotion),
    [gpu, isMobileViewport, reducedMotion],
  );
  const camera = useMemo<CameraProfile>(() => {
    if (isMobileViewport) {
      return { position: [0, 0, 9.4], fov: 56 };
    }

    return { position: [0, 0.2, 7.2], fov: 48 };
  }, [isMobileViewport]);

  if (!webglReady) {
    return <div aria-hidden className="scene-fallback" />;
  }

  return (
    <div aria-hidden className="scene-layer">
      <Suspense fallback={<div className="scene-loading" />}>
        <Canvas
          dpr={quality.dpr}
          shadows={quality.shadows}
          gl={{ antialias: quality.antialias, alpha: true, powerPreference: 'high-performance' }}
          camera={camera}
        >
          <FuturisticScene quality={quality.mode} isMobile={isMobileViewport} />
        </Canvas>
      </Suspense>
    </div>
  );
}
