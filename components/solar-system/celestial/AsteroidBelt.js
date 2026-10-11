// AsteroidBelt.js - GPU Accelerated asteroid belt
'use client';
import { useMemo, useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils, InstancedBufferAttribute } from 'three';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const groupRef = useRef();
  const tempObject = useMemo(() => new Object3D(), []);
  
  const innerRadius = 3.5;
  const outerRadius = 4.8;
  
  // Pre-compute all asteroid transforms and rotation deltas once
  const asteroidData = useMemo(() => {
    const positions = new Float32Array(asteroidCount * 3);
    const initialRotations = new Float32Array(asteroidCount * 3);
    const rotationSpeeds = new Float32Array(asteroidCount * 3);
    const scales = new Float32Array(asteroidCount);
    
    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      
      const i3 = i * 3;
      positions[i3]     = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      positions[i3 + 1] = (Math.random() - 0.5) * 0.3;
      positions[i3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      
      initialRotations[i3]     = Math.random() * Math.PI * 2;
      initialRotations[i3 + 1] = Math.random() * Math.PI * 2;
      initialRotations[i3 + 2] = Math.random() * Math.PI * 2;
      
      // Pass raw rotation speeds (rads per second roughly)
      rotationSpeeds[i3]     = (Math.random() - 0.5) * 2.0;
      rotationSpeeds[i3 + 1] = (Math.random() - 0.5) * 2.0;
      rotationSpeeds[i3 + 2] = (Math.random() - 0.5) * 2.0;
      
      scales[i] = MathUtils.lerp(0.002, 0.008, Math.random());
    }
    
    return { positions, initialRotations, rotationSpeeds, scales };
  }, [asteroidCount]);

  // Set initial instance matrices once on mount
  useEffect(() => {
    if (!meshRef.current) return;
    const { positions, scales } = asteroidData;
    
    for (let i = 0; i < asteroidCount; i++) {
      const i3 = i * 3;
      tempObject.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      // Rotation handled by shader, set to 0 here
      tempObject.rotation.set(0, 0, 0);
      tempObject.scale.setScalar(scales[i]);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    // Attach custom instanced attributes to geometry
    const geometry = meshRef.current.geometry;
    geometry.setAttribute('aInitialRotation', new InstancedBufferAttribute(asteroidData.initialRotations, 3));
    geometry.setAttribute('aRotationSpeed', new InstancedBufferAttribute(asteroidData.rotationSpeeds, 3));
  }, [asteroidCount, asteroidData, tempObject]);

  // Shader injection for GPU rotation
  const onBeforeCompile = useCallback((shader) => {
    shader.uniforms.uTime = { value: 0 };

    // Save reference to update time
    if (materialRef.current) {
        materialRef.current.userData.shader = shader;
    }

    shader.vertexShader = `
        attribute vec3 aRotationSpeed;
        attribute vec3 aInitialRotation;
        uniform float uTime;

        // Euler rotation matrix calculation
        mat4 eulerMatrix(vec3 e) {
            float cx = cos(e.x), sx = sin(e.x);
            float cy = cos(e.y), sy = sin(e.y);
            float cz = cos(e.z), sz = sin(e.z);

            mat4 rotX = mat4(
                1.0, 0.0, 0.0, 0.0,
                0.0, cx, sx, 0.0,
                0.0, -sx, cx, 0.0,
                0.0, 0.0, 0.0, 1.0
            );
            mat4 rotY = mat4(
                cy, 0.0, -sy, 0.0,
                0.0, 1.0, 0.0, 0.0,
                sy, 0.0, cy, 0.0,
                0.0, 0.0, 0.0, 1.0
            );
            mat4 rotZ = mat4(
                cz, sz, 0.0, 0.0,
                -sz, cz, 0.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                0.0, 0.0, 0.0, 1.0
            );
            return rotZ * rotY * rotX;
        }

        ${shader.vertexShader}
    `;

    shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        vec3 currentRot = aInitialRotation + aRotationSpeed * uTime;
        mat4 rotMat = eulerMatrix(currentRot);
        vec3 transformed = (rotMat * vec4(position, 1.0)).xyz;
        `
    );

    shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        `
        vec3 currentRotNormal = aInitialRotation + aRotationSpeed * uTime;
        mat4 rotMatNormal = eulerMatrix(currentRotNormal);
        vec3 objectNormal = (rotMatNormal * vec4(normal, 0.0)).xyz;
        `
    );
  }, []);

  useFrame((state) => {
    // Slow group rotation for overall belt movement
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }

    // Update uniform time for shader
    if (materialRef.current?.userData?.shader) {
        materialRef.current.userData.shader.uniforms.uTime.value = state.clock.elapsedTime * 0.5;
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
          onBeforeCompile={onBeforeCompile}
        />
      </instancedMesh>
    </group>
  );
}
