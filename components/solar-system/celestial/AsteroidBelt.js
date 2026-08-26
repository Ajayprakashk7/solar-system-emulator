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
    
    // Combine rotation and speed into a single array for easier shader passing if needed,
    // but for shader approach, we'll store speeds as a buffer attribute
    return { positions, rotations, rotationSpeeds, scales };
  }, [asteroidCount]);

  // Pass rotation speeds as an instanced buffer attribute
  const rotationSpeedsBuffer = useMemo(() => {
    return new Float32Array(asteroidData.rotationSpeeds);
  }, [asteroidData]);

  // Set initial instance matrices once on mount
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

  // Rotate the entire belt group slowly
  const groupRef = useRef();

  // Custom shader uniform for time
  const customUniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  useFrame((state, delta) => {
    // Slow group rotation for overall belt movement
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
    // Update time uniform for the shader
    customUniforms.uTime.value += delta;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[null, null, asteroidCount]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]}>
          <instancedBufferAttribute
            attach="attributes-aRotationSpeed"
            args={[rotationSpeedsBuffer, 3]}
          />
        </icosahedronGeometry>
        <meshStandardMaterial 
          color="#8B4513"
          roughness={0.9}
          metalness={0.1}
          onBeforeCompile={(shader) => {
            shader.uniforms.uTime = customUniforms.uTime;

            // Add custom attribute and uniforms
            shader.vertexShader = shader.vertexShader.replace(
              '#include <common>',
              `
              #include <common>
              attribute vec3 aRotationSpeed;
              uniform float uTime;

              // Function to rotate a vector by a quaternion
              vec3 rotateVectorByQuaternion(vec3 v, vec4 q) {
                return 2.0 * cross(q.xyz, v * q.w + cross(q.xyz, v)) + v;
              }

              // Function to create a quaternion from euler angles
              vec4 eulerToQuaternion(vec3 euler) {
                float c1 = cos(euler.x * 0.5);
                float c2 = cos(euler.y * 0.5);
                float c3 = cos(euler.z * 0.5);
                float s1 = sin(euler.x * 0.5);
                float s2 = sin(euler.y * 0.5);
                float s3 = sin(euler.z * 0.5);

                return vec4(
                  s1 * c2 * c3 - c1 * s2 * s3,
                  c1 * s2 * c3 + s1 * c2 * s3,
                  c1 * c2 * s3 - s1 * s2 * c3,
                  c1 * c2 * c3 + s1 * s2 * s3
                );
              }
              `
            );

            // Inject rotation logic into the vertex shader
            shader.vertexShader = shader.vertexShader.replace(
              '#include <begin_vertex>',
              `
              #include <begin_vertex>
              // Calculate dynamic rotation based on time and individual speed
              vec3 dynamicEuler = aRotationSpeed * uTime * 60.0; // scale up speed to match JS frame accumulation
              vec4 dynamicQuat = eulerToQuaternion(dynamicEuler);

              // Apply dynamic rotation to the local vertex position BEFORE instance matrix transforms it
              transformed = rotateVectorByQuaternion(transformed, dynamicQuat);
              `
            );

            // Note: Normal transformation omitted for brevity as asteroids are low-poly and low-light,
            // but for perfect lighting, normals should also be rotated. Given the visual style, this is acceptable.
          }}
        />
      </instancedMesh>
    </group>
  );
}
