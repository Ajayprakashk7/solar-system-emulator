// AsteroidBelt.js - Performance-optimized asteroid belt
'use client';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils, InstancedBufferAttribute } from 'three';

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
      
      rotationSpeeds[i3]     = (Math.random() - 0.5) * 2.0;
      rotationSpeeds[i3 + 1] = (Math.random() - 0.5) * 2.0;
      rotationSpeeds[i3 + 2] = (Math.random() - 0.5) * 2.0;
      
      scales[i] = MathUtils.lerp(0.002, 0.008, Math.random());
    }
    
    return { positions, rotations, rotationSpeeds, scales };
  }, [asteroidCount]);

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

    if (meshRef.current.geometry) {
      meshRef.current.geometry.setAttribute(
        'aRotationSpeed',
        new InstancedBufferAttribute(asteroidData.rotationSpeeds, 3)
      );
    }
  }, [asteroidCount, asteroidData, tempObject]);

  const groupRef = useRef();
  const materialRef = useRef();

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
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          ref={materialRef}
          color="#8B4513"
          roughness={0.9}
          metalness={0.1}
          onBeforeCompile={(shader) => {
            shader.uniforms.uTime = { value: 0 };
            materialRef.current.userData.shader = shader;
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
              `
            );
            shader.vertexShader = shader.vertexShader.replace(
              '#include <beginnormal_vertex>',
              `
              #include <beginnormal_vertex>
              mat4 rotX = rotationMatrix(vec3(1.0, 0.0, 0.0), aRotationSpeed.x * uTime);
              mat4 rotY = rotationMatrix(vec3(0.0, 1.0, 0.0), aRotationSpeed.y * uTime);
              mat4 rotZ = rotationMatrix(vec3(0.0, 0.0, 1.0), aRotationSpeed.z * uTime);
              mat4 rot = rotZ * rotY * rotX;
              objectNormal = (rot * vec4(objectNormal, 1.0)).xyz;
              `
            );
            shader.vertexShader = shader.vertexShader.replace(
              '#include <begin_vertex>',
              `
              #include <begin_vertex>
              transformed = (rot * vec4(transformed, 1.0)).xyz;
              `
            );
          }}
        />
      </instancedMesh>
    </group>
  );
}
