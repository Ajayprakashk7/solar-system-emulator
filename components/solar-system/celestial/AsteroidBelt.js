// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils, Vector3 } from 'three';
import { nasaAPI } from '../services/nasaAPI';
import { nasaLogger } from '../../../lib/logger';

// Custom shader for instanced rotation
const onBeforeCompile = (shader) => {
  shader.uniforms.uTime = { value: 0 };

  // Inject attributes and uniforms
  shader.vertexShader = shader.vertexShader.replace(
    'void main() {',
    `
    attribute vec3 aRotationSpeed;
    attribute vec3 aInitialRotation;
    uniform float uTime;

    // Matrix rotation functions
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

    void main() {
    `
  );

  // Apply rotation
  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    `
    #include <begin_vertex>
    // Calculate current rotation (initial + speed * time)
    vec3 currentRot = aInitialRotation + aRotationSpeed * uTime;

    // Apply rotations (Euler XYZ order)
    mat4 rotX = rotationMatrix(vec3(1.0, 0.0, 0.0), currentRot.x);
    mat4 rotY = rotationMatrix(vec3(0.0, 1.0, 0.0), currentRot.y);
    mat4 rotZ = rotationMatrix(vec3(0.0, 0.0, 1.0), currentRot.z);
    mat4 finalRot = rotZ * rotY * rotX;

    // Apply local rotation to vertex before instance matrix
    transformed = (finalRot * vec4(position, 1.0)).xyz;
    `
  );

  // Apply rotation to normals
  shader.vertexShader = shader.vertexShader.replace(
    '#include <beginnormal_vertex>',
    `
    #include <beginnormal_vertex>
    vec3 currentRotNormal = aInitialRotation + aRotationSpeed * uTime;
    mat4 rotXNormal = rotationMatrix(vec3(1.0, 0.0, 0.0), currentRotNormal.x);
    mat4 rotYNormal = rotationMatrix(vec3(0.0, 1.0, 0.0), currentRotNormal.y);
    mat4 rotZNormal = rotationMatrix(vec3(0.0, 0.0, 1.0), currentRotNormal.z);
    mat4 finalRotNormal = rotZNormal * rotYNormal * rotXNormal;

    objectNormal = (finalRotNormal * vec4(normal, 0.0)).xyz;
    `
  );
};

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const [neoData, setNeoData] = useState(null);
  
  // Asteroid belt parameters (between Mars ~1.5 AU and Jupiter ~5.2 AU)
  const innerRadius = 3.5;
  const outerRadius = 4.8;
  
  // Optionally fetch real Near-Earth Object data from NASA
  useEffect(() => {
    nasaAPI.getNearEarthObjects().then((data) => {
      if (data?.element_count > 0) {
        nasaLogger.debug(`Loaded ${data.element_count} near-Earth objects`);
        setNeoData(data);
        // Future enhancement: Use neoData to position asteroids based on real orbital data
        nasaLogger.debug('Integration ready for enhanced asteroid positioning');
      }
    }).catch((error) => {
      nasaLogger.warn('Failed to fetch NEO data, using procedural generation:', error);
    });
  }, []);
  
  // Log NEO data status for debugging
  useEffect(() => {
    if (neoData) {
      nasaLogger.debug('Data available:', neoData.element_count, 'objects');
    }
  }, [neoData]);
  
  // Generate asteroid static positions and rotation attributes
  const { rotationSpeeds, initialRotations } = useMemo(() => {
    const rotSpeeds = new Float32Array(asteroidCount * 3);
    const initRot = new Float32Array(asteroidCount * 3);

    for (let i = 0; i < asteroidCount; i++) {
      // Initial Rotations
      initRot[i * 3] = Math.random() * Math.PI;
      initRot[i * 3 + 1] = Math.random() * Math.PI;
      initRot[i * 3 + 2] = Math.random() * Math.PI;
      
      // Rotation Speeds
      rotSpeeds[i * 3] = (Math.random() - 0.5) * 2.0;
      rotSpeeds[i * 3 + 1] = (Math.random() - 0.5) * 2.0;
      rotSpeeds[i * 3 + 2] = (Math.random() - 0.5) * 2.0;
    }

    return {
      rotationSpeeds: rotSpeeds,
      initialRotations: initRot,
    };
  }, [asteroidCount]);

  useEffect(() => {
    if (meshRef.current) {
      // Extract computeMatrices from the useMemo result, avoid calling the float array as object
      // Re-use compute logic based on state dependencies
      const dummy = new Object3D();
      const pos = new Vector3();
      for (let i = 0; i < asteroidCount; i++) {
        const angle = (i / asteroidCount) * Math.PI * 2;
        const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
        const heightVariation = (Math.random() - 0.5) * 0.3;

        pos.set(
          Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5,
          heightVariation,
          Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5
        );

        const scale = MathUtils.lerp(0.002, 0.008, Math.random());

        dummy.position.copy(pos);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();

        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [asteroidCount]);

  useFrame((state) => {
    // Update only the time uniform on the material
    if (materialRef.current && materialRef.current.userData.shader) {
      // Scale time to keep rotation speed reasonable
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
        <instancedBufferAttribute attach="attributes-aRotationSpeed" args={[rotationSpeeds, 3]} />
        <instancedBufferAttribute attach="attributes-aInitialRotation" args={[initialRotations, 3]} />
      </icosahedronGeometry>
      <meshStandardMaterial 
        ref={materialRef}
        color="#8B4513"
        roughness={0.9}
        metalness={0.1}
        onBeforeCompile={(shader) => {
          onBeforeCompile(shader);
          materialRef.current.userData.shader = shader;
        }}
      />
    </instancedMesh>
  );
}
