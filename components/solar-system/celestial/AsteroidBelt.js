// AsteroidBelt.js - low-overhead instanced asteroid belt
'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, Object3D, Sphere, StaticDrawUsage, Vector3 } from 'three';
import { useSimulationClock } from '../contexts/SimulationClockContext';
import { J2000_JULIAN_DATE } from '../lib/orbitalMechanics';
import { unitRandom } from '../utils/deterministicRandom';

const INNER_RADIUS = 3.5;
const OUTER_RADIUS = 4.8;
const REPRESENTATIVE_ORBIT_DAYS = 1680; // ~4.6 years, main-belt midpoint.
const TWO_PI = Math.PI * 2;

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef(null);
  const groupRef = useRef(null);
  const tempObject = useMemo(() => new Object3D(), []);
  const { currentJulianDateRef } = useSimulationClock();

  const asteroidData = useMemo(() => {
    const positions = new Float32Array(asteroidCount * 3);
    const rotations = new Float32Array(asteroidCount * 3);
    const scales = new Float32Array(asteroidCount);

    for (let i = 0; i < asteroidCount; i += 1) {
      const angle = (i / asteroidCount) * TWO_PI;
      const radius = MathUtils.lerp(INNER_RADIUS, OUTER_RADIUS, unitRandom(i, 0));
      const i3 = i * 3;

      positions[i3] = Math.cos(angle) * radius + (unitRandom(i, 1) - 0.5) * 0.5;
      positions[i3 + 1] = (unitRandom(i, 2) - 0.5) * 0.3;
      positions[i3 + 2] = Math.sin(angle) * radius + (unitRandom(i, 3) - 0.5) * 0.5;

      rotations[i3] = unitRandom(i, 4) * Math.PI;
      rotations[i3 + 1] = unitRandom(i, 5) * Math.PI;
      rotations[i3 + 2] = unitRandom(i, 6) * Math.PI;
      scales[i] = MathUtils.lerp(0.002, 0.008, unitRandom(i, 7));
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
    mesh.boundingSphere = new Sphere(new Vector3(0, 0, 0), OUTER_RADIUS);
  }, [asteroidCount, asteroidData, tempObject]);

  useFrame(() => {
    if (!groupRef.current) return;
    const elapsedDays = currentJulianDateRef.current - J2000_JULIAN_DATE;
    groupRef.current.rotation.y = (elapsedDays / REPRESENTATIVE_ORBIT_DAYS) * TWO_PI;
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
