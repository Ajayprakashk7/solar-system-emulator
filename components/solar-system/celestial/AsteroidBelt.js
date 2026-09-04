// AsteroidBelt.js - Performance-optimized asteroid belt
'use client';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils, InstancedBufferAttribute } from 'three';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const tempObject = useMemo(() => new Object3D(), []);
  
  const innerRadius = 3.5;
  const outerRadius = 4.8;
  
  // Pre-compute all asteroid transforms once
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
      
      // Speed per second
      rotationSpeeds[i3]     = (Math.random() - 0.5) * 1.2;
      rotationSpeeds[i3 + 1] = (Math.random() - 0.5) * 1.2;
      rotationSpeeds[i3 + 2] = (Math.random() - 0.5) * 1.2;
      
      scales[i] = MathUtils.lerp(0.002, 0.008, Math.random());
    }
    
    return { positions, rotations, rotationSpeeds, scales };
  }, [asteroidCount]);

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

    // Set rotation speeds as instance attribute
    meshRef.current.geometry.setAttribute(
      'rotationSpeed',
      new InstancedBufferAttribute(asteroidData.rotationSpeeds, 3)
    );
  }, [asteroidCount, asteroidData, tempObject]);

  const groupRef = useRef();

  useFrame((state) => {
    // Slow group rotation for overall belt movement
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.06;
    }

    if (materialRef.current?.userData?.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[null, null, asteroidCount]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial 
          ref={materialRef}
          color="#8B4513"
          roughness={0.9}
          metalness={0.1}
          onBeforeCompile={(shader) => {
            shader.uniforms.uTime = { value: 0 };
            materialRef.current.userData.shader = shader;

            shader.vertexShader = `
              uniform float uTime;
              attribute vec3 rotationSpeed;

              mat4 rotationMatrix(vec3 euler) {
                float c = cos(euler.x);
                float s = sin(euler.x);
                mat4 rx = mat4(
                  1.0, 0.0, 0.0, 0.0,
                  0.0, c, -s, 0.0,
                  0.0, s, c, 0.0,
                  0.0, 0.0, 0.0, 1.0
                );

                c = cos(euler.y);
                s = sin(euler.y);
                mat4 ry = mat4(
                  c, 0.0, s, 0.0,
                  0.0, 1.0, 0.0, 0.0,
                  -s, 0.0, c, 0.0,
                  0.0, 0.0, 0.0, 1.0
                );

                c = cos(euler.z);
                s = sin(euler.z);
                mat4 rz = mat4(
                  c, -s, 0.0, 0.0,
                  s, c, 0.0, 0.0,
                  0.0, 0.0, 1.0, 0.0,
                  0.0, 0.0, 0.0, 1.0
                );

                return rz * ry * rx;
              }
            ` + shader.vertexShader;

            shader.vertexShader = shader.vertexShader.replace(
              '#include <beginnormal_vertex>',
              `
              vec3 euler = rotationSpeed * uTime;
              mat4 rotMat = rotationMatrix(euler);
              vec3 objectNormal = (rotMat * vec4(normal, 0.0)).xyz;
              `
            );

            shader.vertexShader = shader.vertexShader.replace(
              '#include <begin_vertex>',
              `
              vec3 transformed = (rotMat * vec4(position, 1.0)).xyz;
              `
            );
          }}
        />
      </instancedMesh>
    </group>
  );
}
