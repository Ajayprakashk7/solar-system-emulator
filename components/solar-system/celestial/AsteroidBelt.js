// AsteroidBelt.js - Performance-optimized asteroid belt
'use client';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils } from 'three';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const tempObject = useMemo(() => new Object3D(), []);
  
  const innerRadius = 3.5;
  const outerRadius = 4.8;
  
  // Pre-compute all asteroid transforms and rotation speeds once
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
      
      // Roughly equivalent to previous 0.02 rad per frame at 60fps (0.02 * 60 = 1.2 rad/sec)
      rotationSpeeds[i3]     = (Math.random() - 0.5) * 1.2;
      rotationSpeeds[i3 + 1] = (Math.random() - 0.5) * 1.2;
      rotationSpeeds[i3 + 2] = (Math.random() - 0.5) * 1.2;
      
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

  const groupRef = useRef();

  useFrame((state) => {
    // Slow group rotation for overall belt movement (~0.06 deg/frame)
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
    
    // Update shader uniform for GPU animation
    if (materialRef.current?.userData?.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.elapsedTime;
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
            shader.vertexShader = `
              uniform float uTime;
              attribute vec3 aRotationSpeed;

              mat3 rotationMatrix(vec3 euler) {
                float c1 = cos(euler.x); float s1 = sin(euler.x);
                float c2 = cos(euler.y); float s2 = sin(euler.y);
                float c3 = cos(euler.z); float s3 = sin(euler.z);
                mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, c1, s1, 0.0, -s1, c1);
                mat3 ry = mat3(c2, 0.0, -s2, 0.0, 1.0, 0.0, s2, 0.0, c2);
                mat3 rz = mat3(c3, s3, 0.0, -s3, c3, 0.0, 0.0, 0.0, 1.0);
                return rz * ry * rx;
              }
            ` + shader.vertexShader;

            shader.vertexShader = shader.vertexShader.replace(
              '#include <beginnormal_vertex>',
              `
              vec3 euler = aRotationSpeed * uTime;
              mat3 rotMat = rotationMatrix(euler);
              vec3 objectNormal = rotMat * normal;
              `
            );

            shader.vertexShader = shader.vertexShader.replace(
              '#include <begin_vertex>',
              `
              vec3 transformed = rotMat * position;
              `
            );

            if (materialRef.current) {
              materialRef.current.userData.shader = shader;
            }
          }}
        />
      </instancedMesh>
    </group>
  );
}
