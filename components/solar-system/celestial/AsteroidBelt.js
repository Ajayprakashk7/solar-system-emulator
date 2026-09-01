// AsteroidBelt.js - GPU-optimized asteroid belt with custom shader animation
'use client';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils } from 'three';
import { useSpeedControl } from '../contexts/SpeedControlContext';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const tempObject = useMemo(() => new Object3D(), []);
  const { speedFactor } = useSpeedControl();
  
  const innerRadius = 3.5;
  const outerRadius = 4.8;
  
  // Pre-compute all asteroid transforms and rotation speeds once
  const asteroidData = useMemo(() => {
    const positions = new Float32Array(asteroidCount * 3);
    const rotationSpeeds = new Float32Array(asteroidCount * 3);
    const scales = new Float32Array(asteroidCount);
    
    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      
      const i3 = i * 3;
      positions[i3]     = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      positions[i3 + 1] = (Math.random() - 0.5) * 0.3;
      positions[i3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      
      // We pass rotation speeds to the shader to animate tumble on the GPU
      rotationSpeeds[i3]     = (Math.random() - 0.5) * 2.0; // x speed
      rotationSpeeds[i3 + 1] = (Math.random() - 0.5) * 2.0; // y speed
      rotationSpeeds[i3 + 2] = (Math.random() - 0.5) * 2.0; // z speed
      
      scales[i] = MathUtils.lerp(0.002, 0.008, Math.random());
    }
    
    return { positions, rotationSpeeds, scales };
  }, [asteroidCount]);

  // Set initial instance matrices once on mount
  useEffect(() => {
    if (!meshRef.current) return;
    const { positions, scales } = asteroidData;
    
    for (let i = 0; i < asteroidCount; i++) {
      const i3 = i * 3;
      tempObject.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      // Initial rotation is 0; the shader will handle it
      tempObject.rotation.set(0, 0, 0);
      tempObject.scale.setScalar(scales[i]);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroidCount, asteroidData, tempObject]);

  // Rotate the entire belt group slowly
  const groupRef = useRef();

  useFrame((state, delta) => {
    // Slow group rotation for overall belt movement (~0.06 deg/frame at 1x speed)
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001 * speedFactor;
    }

    // Update uniform time for GPU animation
    if (materialRef.current && materialRef.current.userData.shader) {
        // Accumulate time multiplied by speedFactor for consistent animation
        if(materialRef.current.userData.timeAccumulator === undefined) {
             materialRef.current.userData.timeAccumulator = 0;
        }
        materialRef.current.userData.timeAccumulator += delta * speedFactor;
        materialRef.current.userData.shader.uniforms.uTime.value = materialRef.current.userData.timeAccumulator;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[null, null, asteroidCount]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]}>
            <instancedBufferAttribute
                attach="attributes-aRotationSpeed"
                args={[asteroidData.rotationSpeeds, 3]}
            />
        </icosahedronGeometry>
        <meshStandardMaterial 
          ref={materialRef}
          color="#8B4513"
          roughness={0.9}
          metalness={0.1}
          onBeforeCompile={(shader) => {
            shader.uniforms.uTime = { value: 0 };
            materialRef.current.userData.shader = shader;

            // Add uniforms and attributes
            shader.vertexShader = shader.vertexShader.replace(
              '#include <common>',
              `
              #include <common>
              uniform float uTime;
              attribute vec3 aRotationSpeed;

              mat4 rotationMatrix(vec3 axis, float angle) {
                  axis = normalize(axis);
                  float s = sin(angle);
                  float c = cos(angle);
                  float oc = 1.0 - c;

                  return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                              oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                              oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                              0.0,                                0.0,                                0.0,                                1.0);
              }

              vec3 rotateVector(mat4 m, vec3 v) {
                  return (m * vec4(v, 1.0)).xyz;
              }
              `
            );

            // Apply rotation to position and normal
            shader.vertexShader = shader.vertexShader.replace(
              '#include <begin_vertex>',
              `
              #include <begin_vertex>

              // Calculate individual rotations based on speed and time
              mat4 rotX = rotationMatrix(vec3(1.0, 0.0, 0.0), aRotationSpeed.x * uTime);
              mat4 rotY = rotationMatrix(vec3(0.0, 1.0, 0.0), aRotationSpeed.y * uTime);
              mat4 rotZ = rotationMatrix(vec3(0.0, 0.0, 1.0), aRotationSpeed.z * uTime);
              mat4 finalRot = rotZ * rotY * rotX;

              transformed = rotateVector(finalRot, transformed);
              `
            );

            // Apply rotation to normals for correct lighting
            shader.vertexShader = shader.vertexShader.replace(
              '#include <beginnormal_vertex>',
              `
              #include <beginnormal_vertex>

              mat4 rotX_n = rotationMatrix(vec3(1.0, 0.0, 0.0), aRotationSpeed.x * uTime);
              mat4 rotY_n = rotationMatrix(vec3(0.0, 1.0, 0.0), aRotationSpeed.y * uTime);
              mat4 rotZ_n = rotationMatrix(vec3(0.0, 0.0, 1.0), aRotationSpeed.z * uTime);
              mat4 finalRot_n = rotZ_n * rotY_n * rotX_n;

              objectNormal = rotateVector(finalRot_n, objectNormal);
              `
            );
          }}
        />
      </instancedMesh>
    </group>
  );
}
