// AsteroidBelt.js - low-overhead instanced asteroid belt
'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, Object3D, StaticDrawUsage } from 'three';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef(null);
  const groupRef = useRef(null);
  const tempObject = useMemo(() => new Object3D(), []);

  const innerRadius = 3.5;
  const outerRadius = 4.8;

  // Asteroids are tiny at this scene scale. Randomized static orientations plus
  // one belt transform provide convincing motion without rebuilding hundreds of
  // matrices on the main thread every few frames.
  const asteroidData = useMemo(() => {
    const positions = new Float32Array(asteroidCount * 3);
    const rotations = new Float32Array(asteroidCount * 3);
    const scales = new Float32Array(asteroidCount);

    for (let i = 0; i < asteroidCount; i += 1) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const i3 = i * 3;

      positions[i3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      positions[i3 + 1] = (Math.random() - 0.5) * 0.3;
      positions[i3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;

      rotations[i3] = Math.random() * Math.PI;
      rotations[i3 + 1] = Math.random() * Math.PI;
      rotations[i3 + 2] = Math.random() * Math.PI;
      scales[i] = MathUtils.lerp(0.002, 0.008, Math.random());
    }

    return { positions, rotations, scales };
  }, [asteroidCount]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const { positions, rotations, scales } = asteroidData;
    mesh.instanceMatrix.setUsage(StaticDrawUsage);

    for (let i = 0; i < asteroidCount; i += 1) {
      const i3 = i * 3;
      tempObject.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      tempObject.rotation.set(rotations[i3], rotations[i3 + 1], rotations[i3 + 2]);
      tempObject.scale.setScalar(scales[i]);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    // Instanced meshes need bounds after their instance matrices are populated.
    // Without this, culling can be wrong or has to be disabled entirely.
    mesh.computeBoundingSphere();
  }, [asteroidCount, asteroidData, tempObject]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.06;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[null, null, asteroidCount]} frustumCulled>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} metalness={0.1} />
      </instancedMesh>
    </group>
  );
}
