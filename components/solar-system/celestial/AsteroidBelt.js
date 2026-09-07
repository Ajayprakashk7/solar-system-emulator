// AsteroidBelt.js - Performance-optimized asteroid belt
'use client';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils, } from 'three';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  const tempObject = useMemo(() => new Object3D(), []);
  const customUniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);
  
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
    const { positions, scales } = asteroidData;
    
    for (let i = 0; i < asteroidCount; i++) {
      const i3 = i * 3;
      tempObject.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      tempObject.rotation.set(0, 0, 0); // Rotation handled by vertex shader
      tempObject.scale.setScalar(scales[i]);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroidCount, asteroidData, tempObject]);

  // Rotate the entire belt group slowly instead of updating each asteroid individually.
  // This replaces 500-1000 per-object matrix updates with a single group rotation.
  // Individual asteroid tumble is handled by updating matrices every N frames.
  const groupRef = useRef();

  useFrame((state) => {
    customUniforms.uTime.value = state.clock.elapsedTime;
    // Slow group rotation for overall belt movement (~0.06 deg/frame)
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[null, null, asteroidCount]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]}>
          <instancedBufferAttribute
            attach="attributes-aInitialRotation"
            args={[asteroidData.rotations, 3]}
          />
          <instancedBufferAttribute
            attach="attributes-aRotationSpeed"
            args={[asteroidData.rotationSpeeds, 3]}
          />
        </icosahedronGeometry>
        <meshStandardMaterial 
          color="#8B4513"
          roughness={0.9}
          metalness={0.1}
          onBeforeCompile={(shader) => {
            shader.uniforms.uTime = customUniforms.uTime;

            shader.vertexShader = `
              uniform float uTime;
              attribute vec3 aRotationSpeed;
              attribute vec3 aInitialRotation;

              mat3 eulerToRotationMatrix(vec3 euler) {
                  float cx = cos(euler.x), sx = sin(euler.x);
                  float cy = cos(euler.y), sy = sin(euler.y);
                  float cz = cos(euler.z), sz = sin(euler.z);

                  mat3 rx = mat3(
                      1.0, 0.0, 0.0,
                      0.0, cx, sx,
                      0.0, -sx, cx
                  );
                  mat3 ry = mat3(
                      cy, 0.0, -sy,
                      0.0, 1.0, 0.0,
                      sy, 0.0, cy
                  );
                  mat3 rz = mat3(
                      cz, sz, 0.0,
                      -sz, cz, 0.0,
                      0.0, 0.0, 1.0
                  );
                  return rz * ry * rx;
              }

              ${shader.vertexShader}
            `;

            shader.vertexShader = shader.vertexShader.replace(
              '#include <beginnormal_vertex>',
              `
              vec3 currentRotation = aInitialRotation + (aRotationSpeed * 60.0) * uTime;
              mat3 rotMat = eulerToRotationMatrix(currentRotation);
              vec3 objectNormal = rotMat * normal;
              `
            );

            shader.vertexShader = shader.vertexShader.replace(
              '#include <begin_vertex>',
              `
              vec3 transformed = rotMat * position;
              `
            );
          }}
        />
      </instancedMesh>
    </group>
  );
}
