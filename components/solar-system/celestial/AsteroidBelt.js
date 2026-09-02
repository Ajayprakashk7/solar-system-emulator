// AsteroidBelt.js - Performance-optimized asteroid belt
'use client';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils, } from 'three';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  const tempObject = useMemo(() => new Object3D(), []);
  
  const innerRadius = 3.5;
  const outerRadius = 4.8;
  
  // Pre-compute all asteroid transforms and rotation deltas once
  const asteroidData = useMemo(() => {
    const positions = new Float32Array(asteroidCount * 3);
    const rotations = new Float32Array(asteroidCount * 3);
    const rotationSpeeds = new Float32Array(asteroidCount * 3);
    const scales = new Float32Array(asteroidCount);
    
    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      
      const i3 = i * 3;
      positions[i3]     = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      positions[i3 + 1] = (Math.random() - 0.5) * 0.3;
      positions[i3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      
      rotations[i3]     = Math.random() * Math.PI;
      rotations[i3 + 1] = Math.random() * Math.PI;
      rotations[i3 + 2] = Math.random() * Math.PI;
      
      rotationSpeeds[i3]     = (Math.random() - 0.5) * 0.02;
      rotationSpeeds[i3 + 1] = (Math.random() - 0.5) * 0.02;
      rotationSpeeds[i3 + 2] = (Math.random() - 0.5) * 0.02;
      
      scales[i] = MathUtils.lerp(0.002, 0.008, Math.random());
    }
    
    return { positions, rotations, rotationSpeeds, scales };
  }, [asteroidCount]);

  // Set initial instance matrices once on mount instead of every frame
  useEffect(() => {
    if (!meshRef.current) return;
    const { positions, rotations, scales } = asteroidData;
    
    for (let i = 0; i < asteroidCount; i++) {
      const i3 = i * 3;
      tempObject.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      tempObject.rotation.set(rotations[i3], rotations[i3 + 1], rotations[i3 + 2]);
      tempObject.scale.setScalar(scales[i]);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroidCount, asteroidData, tempObject]);

  const materialRef = useRef();
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  const groupRef = useRef();

  useFrame((state) => {
    // Slow group rotation for overall belt movement (~0.06 deg/frame)
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
    if (materialRef.current) {
      uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[null, null, asteroidCount]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]}>
          <instancedBufferAttribute attach="attributes-aRotationSpeed" args={[asteroidData.rotationSpeeds, 3]} />
        </icosahedronGeometry>
        <meshStandardMaterial 
          ref={materialRef}
          color="#8B4513"
          roughness={0.9}
          metalness={0.1}
          onBeforeCompile={(shader) => {
            shader.uniforms.uTime = uniforms.uTime;

            // Add attributes for rotation speeds
            shader.vertexShader = `
              attribute vec3 aRotationSpeed;
              uniform float uTime;

              // Helper to rotate a vector by a quaternion
              vec3 rotateVector(vec4 q, vec3 v) {
                return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
              }

              // Helper to create a quaternion from Euler angles
              vec4 quatFromEuler(vec3 euler) {
                vec3 c = cos(euler * 0.5);
                vec3 s = sin(euler * 0.5);
                return vec4(
                  s.x * c.y * c.z - c.x * s.y * s.z,
                  c.x * s.y * c.z + s.x * c.y * s.z,
                  c.x * c.y * s.z - s.x * s.y * c.z,
                  c.x * c.y * c.z + s.x * s.y * s.z
                );
              }
              ${shader.vertexShader}
            `;

            shader.vertexShader = shader.vertexShader.replace(
              '#include <begin_vertex>',
              `
              vec3 currentRotation = aRotationSpeed * uTime;
              vec4 qRotation = quatFromEuler(currentRotation);
              vec3 transformed = rotateVector(qRotation, position);
              `
            );

            shader.vertexShader = shader.vertexShader.replace(
              '#include <beginnormal_vertex>',
              `
              vec3 currentRotationNormal = aRotationSpeed * uTime;
              vec4 qRotationNormal = quatFromEuler(currentRotationNormal);
              vec3 objectNormal = rotateVector(qRotationNormal, normal);
              `
            );
          }}
        />
      </instancedMesh>
    </group>
  );
}
