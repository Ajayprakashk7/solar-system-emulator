// CosmicDust.js - GPU-animated interplanetary dust particles
'use client';
import { useMemo, useRef, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending } from 'three';

const CosmicDust = memo(function CosmicDust({ particleCount = 1000 }) {
  const meshRef = useRef();
  
  const spread = 100;
  
  // Generate dust particle positions and colors once
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      const radius = Math.random() * spread;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3]     = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      const brightness = 0.3 + Math.random() * 0.4;
      colors[i3]     = brightness;
      colors[i3 + 1] = brightness * 0.9;
      colors[i3 + 2] = brightness * 0.8;
    }
    
    return { positions, colors };
  }, [particleCount]);

  // Very slow rotation — cheap since it's just a single group transform
  useFrame((state) => {
    if (meshRef.current) {
      // Use elapsedTime directly instead of accumulating. No drift, no per-frame add.
      const t = state.clock.elapsedTime * 0.02;
      meshRef.current.rotation.y = t;
      meshRef.current.rotation.x = t * 0.5;
    }
  });

  return (
    <points ref={meshRef} frustumCulled={false}>
      <bufferGeometry>
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
});

export default CosmicDust;
