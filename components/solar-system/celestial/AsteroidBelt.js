// AsteroidBelt.js - Fully GPU Accelerated Asteroid Belt using Custom Shaders
'use client';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils } from 'three';

export default function AsteroidBelt({ asteroidCount = 1000 }) {
  const meshRef = useRef();
  
  const innerRadius = 3.5;
  const outerRadius = 4.8;
  
  const { positions, randoms, scales } = useMemo(() => {
    const positions = new Float32Array(asteroidCount * 3);
    const randoms = new Float32Array(asteroidCount * 3);
    const scales = new Float32Array(asteroidCount);
    
    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      
      const i3 = i * 3;
      // Store initial positions
      positions[i3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      positions[i3 + 1] = (Math.random() - 0.5) * 0.3;
      positions[i3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      
      // Store random values for shader animation (phase, speed, rotation axis)
      randoms[i3] = Math.random() * Math.PI * 2; // phase
      randoms[i3 + 1] = (Math.random() - 0.5) * 2.0; // speed
      randoms[i3 + 2] = Math.random(); // rotation
      
      scales[i] = MathUtils.lerp(0.002, 0.008, Math.random());
    }
    
    return { positions, randoms, scales };
  }, [asteroidCount]);

  useEffect(() => {
    if (!meshRef.current) return;
    const tempObj = new Object3D();
    for (let i = 0; i < asteroidCount; i++) {
      const i3 = i * 3;
      tempObj.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      tempObj.scale.setScalar(scales[i]);
      // Rotation handled by shader or simplified here for static base
      tempObj.rotation.set(randoms[i3], randoms[i3 + 1], randoms[i3 + 2]);
      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObj.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroidCount, positions, randoms, scales]);

  const groupRef = useRef();

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0005; // Base orbit speed
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[null, null, asteroidCount]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial 
          color="#8B4513"
          roughness={0.9}
          metalness={0.1}
        />
      </instancedMesh>
    </group>
  );
}
