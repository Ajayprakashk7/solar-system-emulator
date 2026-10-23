// CosmicDust.js - lightweight static interplanetary dust particles
'use client';

import { useEffect, useMemo, useRef } from 'react';
import { AdditiveBlending, Sphere, Vector3 } from 'three';
import { unitRandom } from '../utils/deterministicRandom';

const SPREAD = 100;

export default function CosmicDust({ particleCount = 1000 }) {
  const geometryRef = useRef(null);

  const { positions, colors } = useMemo(() => {
    const nextPositions = new Float32Array(particleCount * 3);
    const nextColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i += 1) {
      const i3 = i * 3;
      const radius = unitRandom(i, 20) * SPREAD;
      const theta = unitRandom(i, 21) * Math.PI * 2;
      const phi = Math.acos(2 * unitRandom(i, 22) - 1);

      nextPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      nextPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      nextPositions[i3 + 2] = radius * Math.cos(phi);

      const brightness = 0.3 + unitRandom(i, 23) * 0.4;
      nextColors[i3] = brightness;
      nextColors[i3 + 1] = brightness * 0.9;
      nextColors[i3 + 2] = brightness * 0.8;
    }

    return { positions: nextPositions, colors: nextColors };
  }, [particleCount]);

  useEffect(() => {
    if (geometryRef.current) {
      geometryRef.current.boundingSphere = new Sphere(new Vector3(0, 0, 0), SPREAD);
    }
  }, [positions]);

  // This layer represents distant suspended particulate/starlight depth. A
  // rigid frame-by-frame rotation was visually distracting, cost CPU time, and
  // did not correspond to a meaningful physical motion, so it remains static.
  return (
    <points frustumCulled>
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
        size={0.025}
        vertexColors
        transparent
        opacity={0.2}
        blending={AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
