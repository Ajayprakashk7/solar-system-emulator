// CosmicDust.js - lightweight interplanetary dust particles
'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending } from 'three';

export default function CosmicDust({ particleCount = 1000 }) {
  const pointsRef = useRef(null);
  const geometryRef = useRef(null);
  const spread = 100;

  const { positions, colors } = useMemo(() => {
    const nextPositions = new Float32Array(particleCount * 3);
    const nextColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i += 1) {
      const i3 = i * 3;
      const radius = Math.random() * spread;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      nextPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      nextPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      nextPositions[i3 + 2] = radius * Math.cos(phi);

      const brightness = 0.3 + Math.random() * 0.4;
      nextColors[i3] = brightness;
      nextColors[i3 + 1] = brightness * 0.9;
      nextColors[i3 + 2] = brightness * 0.8;
    }

    return { positions: nextPositions, colors: nextColors };
  }, [particleCount]);

  useEffect(() => {
    // Explicit bounds make frustum culling deterministic for the generated
    // BufferGeometry instead of forcing this particle system to render always.
    geometryRef.current?.computeBoundingSphere();
  }, [positions]);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const rotation = state.clock.elapsedTime * 0.02;
    pointsRef.current.rotation.y = rotation;
    pointsRef.current.rotation.x = rotation * 0.5;
  });

  return (
    <points ref={pointsRef} frustumCulled>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.25}
        blending={AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
