// AsteroidBelt.js - Performance-optimized asteroid belt
'use client';
import { useMemo, useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils } from 'three';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  const materialRef = useRef();
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

  // Set initial instance matrices once on mount
  useEffect(() => {
    if (!meshRef.current) return;
    const { positions, scales } = asteroidData;
    
    for (let i = 0; i < asteroidCount; i++) {
      const i3 = i * 3;
      tempObject.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      // Rotation handled by shader, initialize as identity
      tempObject.rotation.set(0, 0, 0);
      tempObject.scale.setScalar(scales[i]);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroidCount, asteroidData, tempObject]);

  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
    if (materialRef.current && materialRef.current.userData.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[null, null, asteroidCount]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]}>
          <instancedBufferAttribute attach="attributes-aRotation" args={[asteroidData.rotations, 3]} />
          <instancedBufferAttribute attach="attributes-aRotationSpeed" args={[asteroidData.rotationSpeeds, 3]} />
        </icosahedronGeometry>
        <meshStandardMaterial 
          ref={materialRef}
          color="#8B4513"
          roughness={0.9}
          metalness={0.1}
          onBeforeCompile={useCallback((shader) => {
            shader.uniforms.uTime = { value: 0 };
            materialRef.current.userData.shader = shader;
            shader.vertexShader = `
              uniform float uTime;
              attribute vec3 aRotation;
              attribute vec3 aRotationSpeed;

              // Function to create a rotation matrix from euler angles
              mat4 rotationMatrix(vec3 euler) {
                float cX = cos(euler.x);
                float sX = sin(euler.x);
                float cY = cos(euler.y);
                float sY = sin(euler.y);
                float cZ = cos(euler.z);
                float sZ = sin(euler.z);

                mat4 rx = mat4(1.0, 0.0, 0.0, 0.0,
                               0.0, cX, -sX, 0.0,
                               0.0, sX, cX, 0.0,
                               0.0, 0.0, 0.0, 1.0);

                mat4 ry = mat4(cY, 0.0, sY, 0.0,
                               0.0, 1.0, 0.0, 0.0,
                               -sY, 0.0, cY, 0.0,
                               0.0, 0.0, 0.0, 1.0);

                mat4 rz = mat4(cZ, -sZ, 0.0, 0.0,
                               sZ, cZ, 0.0, 0.0,
                               0.0, 0.0, 1.0, 0.0,
                               0.0, 0.0, 0.0, 1.0);

                return rz * ry * rx;
              }

              ${shader.vertexShader}
            `.replace(
              `#include <beginnormal_vertex>`,
              `
              vec3 currentRotation = aRotation + aRotationSpeed * uTime * 60.0;
              mat4 rotMatrix = rotationMatrix(currentRotation);
              vec3 objectNormal = (rotMatrix * vec4(normal, 0.0)).xyz;
              `
            ).replace(
              `#include <begin_vertex>`,
              `
              vec3 transformed = (rotMatrix * vec4(position, 1.0)).xyz;
              `
            );
          }, [])}
        />
      </instancedMesh>
    </group>
  );
}
