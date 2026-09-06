// AsteroidBelt.js - Performance-optimized asteroid belt
'use client';
import { useMemo, useRef, useEffect, useCallback } from 'react';
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
    const scales = new Float32Array(asteroidCount * 3); // Update to vec3 format for InstancedBufferAttribute
    
    for (let i = 0; i < asteroidCount; i++) {
      const i3 = i * 3;
      
      rotations[i3]     = Math.random() * Math.PI * 2;
      rotations[i3 + 1] = Math.random() * Math.PI * 2;
      rotations[i3 + 2] = Math.random() * Math.PI * 2;
      
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
    
    for (let i = 0; i < asteroidCount; i++) {
      tempObject.position.set(
        Math.cos((i / asteroidCount) * Math.PI * 2) * MathUtils.lerp(innerRadius, outerRadius, Math.random()) + (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.3,
        Math.sin((i / asteroidCount) * Math.PI * 2) * MathUtils.lerp(innerRadius, outerRadius, Math.random()) + (Math.random() - 0.5) * 0.5
      );
      // Base scale
      const scale = MathUtils.lerp(0.002, 0.008, Math.random());
      tempObject.scale.setScalar(scale);
      tempObject.rotation.set(0, 0, 0);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroidCount, tempObject, asteroidData]);

  // Material Customization for GPU animation
  const customMaterialRef = useRef();
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  const onBeforeCompile = useCallback((shader) => {
    shader.uniforms.uTime = uniforms.uTime;

    // Add instanced attributes and uniforms
    shader.vertexShader = `
      attribute vec3 aRotationSpeed;
      attribute vec3 aInitialRotation;
      uniform float uTime;

      // rotation matrix functions
      mat3 rotationMatrix(vec3 axis, float angle) {
          axis = normalize(axis);
          float s = sin(angle);
          float c = cos(angle);
          float oc = 1.0 - c;

          return mat3(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
                      oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
                      oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c);
      }

      ${shader.vertexShader}
    `;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      // Calculate total rotation
      vec3 currentRot = aInitialRotation + (aRotationSpeed * uTime * 60.0);

      // Apply Euler rotations (Z-Y-X order for three.js default)
      mat3 rotX = rotationMatrix(vec3(1.0, 0.0, 0.0), currentRot.x);
      mat3 rotY = rotationMatrix(vec3(0.0, 1.0, 0.0), currentRot.y);
      mat3 rotZ = rotationMatrix(vec3(0.0, 0.0, 1.0), currentRot.z);

      mat3 finalRot = rotZ * rotY * rotX;

      vec3 transformed = finalRot * position;
      `
    );

    // CRITICAL: Must also rotate normals for lighting!
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `
      vec3 currentRotNormal = aInitialRotation + (aRotationSpeed * uTime * 60.0);
      mat3 rotXNormal = rotationMatrix(vec3(1.0, 0.0, 0.0), currentRotNormal.x);
      mat3 rotYNormal = rotationMatrix(vec3(0.0, 1.0, 0.0), currentRotNormal.y);
      mat3 rotZNormal = rotationMatrix(vec3(0.0, 0.0, 1.0), currentRotNormal.z);
      mat3 finalRotNormal = rotZNormal * rotYNormal * rotXNormal;

      vec3 objectNormal = finalRotNormal * normal;
      `
    );

    customMaterialRef.current = shader;
  }, [uniforms]);

  // Rotate the entire belt group slowly instead of updating each asteroid individually.
  // This replaces 500-1000 per-object matrix updates with a single group rotation.
  const groupRef = useRef();

  useFrame((state) => {
    // Slow group rotation for overall belt movement (~0.06 deg/frame)
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }

    // Update the uniform time for the shader
    if (uniforms.uTime) {
      uniforms.uTime.value = state.clock.elapsedTime;
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
          onBeforeCompile={onBeforeCompile}
        />
      </instancedMesh>
    </group>
  );
}
