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
  
  // Pre-compute all asteroid transforms and rotation deltas once
  const asteroidData = useMemo(() => {
    const positions = new Float32Array(asteroidCount * 3);
    const rotationSpeeds = new Float32Array(asteroidCount * 3);
    const scales = new Float32Array(asteroidCount);
    
    // Custom attributes for GPU animation
    const aRotationSpeed = new Float32Array(asteroidCount * 3);
    const aInitialRotation = new Float32Array(asteroidCount * 3);

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      
      const i3 = i * 3;
      positions[i3]     = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      positions[i3 + 1] = (Math.random() - 0.5) * 0.3;
      positions[i3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      
      const rotX = Math.random() * Math.PI;
      const rotY = Math.random() * Math.PI;
      const rotZ = Math.random() * Math.PI;
      
      rotationSpeeds[i3]     = (Math.random() - 0.5) * 0.02;
      rotationSpeeds[i3 + 1] = (Math.random() - 0.5) * 0.02;
      rotationSpeeds[i3 + 2] = (Math.random() - 0.5) * 0.02;

      // Map CPU rotation speed to shader animation factor
      aRotationSpeed[i3] = rotationSpeeds[i3] * 60.0;
      aRotationSpeed[i3 + 1] = rotationSpeeds[i3 + 1] * 60.0;
      aRotationSpeed[i3 + 2] = rotationSpeeds[i3 + 2] * 60.0;

      aInitialRotation[i3] = rotX;
      aInitialRotation[i3 + 1] = rotY;
      aInitialRotation[i3 + 2] = rotZ;
      
      scales[i] = MathUtils.lerp(0.002, 0.008, Math.random());
    }
    
    return { positions, scales, aRotationSpeed, aInitialRotation };
  }, [asteroidCount]);

  // Set initial instance matrices once on mount instead of every frame
  useEffect(() => {
    if (!meshRef.current) return;
    const { positions, scales, aRotationSpeed, aInitialRotation } = asteroidData;
    
    for (let i = 0; i < asteroidCount; i++) {
      const i3 = i * 3;
      tempObject.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      // We start at zero rotation here because the shader handles the absolute rotation
      tempObject.rotation.set(0, 0, 0);
      tempObject.scale.setScalar(scales[i]);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    // Attach custom attributes for GPU animation
    meshRef.current.geometry.setAttribute('aRotationSpeed', new InstancedBufferAttribute(aRotationSpeed, 3));
    meshRef.current.geometry.setAttribute('aInitialRotation', new InstancedBufferAttribute(aInitialRotation, 3));
  }, [asteroidCount, asteroidData, tempObject]);

  // Rotate the entire belt group slowly instead of updating each asteroid individually.
  const groupRef = useRef();

  useFrame((state) => {
    // Slow group rotation for overall belt movement (~0.06 deg/frame)
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
    
    // Pass elapsed time to the custom shader for GPU rotation
    if (materialRef.current && materialRef.current.userData.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    materialRef.current.userData.shader = shader;

    shader.vertexShader = `
      uniform float uTime;
      attribute vec3 aRotationSpeed;
      attribute vec3 aInitialRotation;

      mat3 eulerToRotationMatrix(vec3 euler) {
        float cx = cos(euler.x), sx = sin(euler.x);
        float cy = cos(euler.y), sy = sin(euler.y);
        float cz = cos(euler.z), sz = sin(euler.z);

        mat3 mx = mat3(1.0, 0.0, 0.0, 0.0, cx, -sx, 0.0, sx, cx);
        mat3 my = mat3(cy, 0.0, sy, 0.0, 1.0, 0.0, -sy, 0.0, cy);
        mat3 mz = mat3(cz, -sz, 0.0, sz, cz, 0.0, 0.0, 0.0, 1.0);

        return mz * my * mx;
      }

      ${shader.vertexShader}
    `;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      vec3 currentRotation = aInitialRotation + aRotationSpeed * uTime;
      mat3 rotMat = eulerToRotationMatrix(currentRotation);
      vec3 transformed = rotMat * vec3(position);
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `
      vec3 currentRotationNormal = aInitialRotation + aRotationSpeed * uTime;
      mat3 rotMatNormal = eulerToRotationMatrix(currentRotationNormal);
      vec3 objectNormal = rotMatNormal * vec3(normal);
      #ifdef USE_TANGENT
        vec3 objectTangent = vec3(tangent.xyz);
      #endif
      `
    );
  };

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
