// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils } from 'three';
import { nasaAPI } from '../services/nasaAPI';
import { nasaLogger } from '../../../lib/logger';

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
  
  // Generate asteroid properties optimized for GPU
  const { rotationSpeeds, initialRotations, tempMatrix } = useMemo(() => {
    const rotationSpeeds = new Float32Array(asteroidCount * 3);
    const initialRotations = new Float32Array(asteroidCount * 3);

    const tempObject = new Object3D();
    const tempMatrix = new Float32Array(asteroidCount * 16);

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      const y = heightVariation;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      const scale = MathUtils.lerp(0.002, 0.008, Math.random());

      // Store initial rotations
      initialRotations[i * 3] = Math.random() * Math.PI;
      initialRotations[i * 3 + 1] = Math.random() * Math.PI;
      initialRotations[i * 3 + 2] = Math.random() * Math.PI;

      // Store rotation speeds
      rotationSpeeds[i * 3] = (Math.random() - 0.5) * 0.02;
      rotationSpeeds[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      rotationSpeeds[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      
      // Set instance matrix (translation and scale only, rotation handled in shader)
      tempObject.position.set(x, y, z);
      tempObject.rotation.set(0, 0, 0); // Identity rotation
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      
      tempObject.matrix.toArray(tempMatrix, i * 16);
    }
    
    return { rotationSpeeds, initialRotations, tempMatrix };
  }, [asteroidCount, innerRadius, outerRadius]);

  useEffect(() => {
    if (!meshRef.current) return;

    // Set the instance matrix directly from the Float32Array
    meshRef.current.instanceMatrix.array.set(tempMatrix);
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroidCount, tempMatrix]);


  // GPU-based animation loop - only updates uniform time
  useFrame((state) => {
    if (materialRef.current?.userData?.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.elapsedTime * 60.0;
    }
  });

  const onBeforeCompile = useMemo(() => (shader) => {
    shader.uniforms.uTime = { value: 0 };
    materialRef.current.userData.shader = shader;

    // Inject custom attributes and uniforms
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `
      #include <common>
      uniform float uTime;
      attribute vec3 aRotationSpeed;
      attribute vec3 aInitialRotation;

      // Function to create a rotation matrix around X, Y, Z
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

      mat3 getEulerRotationMatrix(vec3 euler) {
          float c1 = cos(euler.x); float s1 = sin(euler.x);
          float c2 = cos(euler.y); float s2 = sin(euler.y);
          float c3 = cos(euler.z); float s3 = sin(euler.z);

          mat3 rotX = mat3(
              1.0, 0.0, 0.0,
              0.0, c1, -s1,
              0.0, s1, c1
          );

          mat3 rotY = mat3(
              c2, 0.0, s2,
              0.0, 1.0, 0.0,
              -s2, 0.0, c2
          );

          mat3 rotZ = mat3(
              c3, -s3, 0.0,
              s3, c3, 0.0,
              0.0, 0.0, 1.0
          );

          // Order: YXZ (or whichever matches Three.js Euler order)
          // XYZ order: Z * Y * X
          return rotZ * rotY * rotX;
      }
      `
    );

    // Apply rotation to transformed vector
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      vec3 currentRotation = aInitialRotation + (aRotationSpeed * uTime);
      mat3 rotMatrix = getEulerRotationMatrix(currentRotation);
      vec3 transformed = rotMatrix * position;
      `
    );

    // Apply rotation to normals
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `
      vec3 currentRotationNormal = aInitialRotation + (aRotationSpeed * uTime);
      mat3 rotMatrixNormal = getEulerRotationMatrix(currentRotationNormal);
      vec3 objectNormal = rotMatrixNormal * normal;
      `
    );
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
        <instancedBufferAttribute
          attach="attributes-aRotationSpeed"
          args={[rotationSpeeds, 3]}
        />
        <instancedBufferAttribute
          attach="attributes-aInitialRotation"
          args={[initialRotations, 3]}
        />
      </icosahedronGeometry>
      <meshStandardMaterial 
        ref={materialRef}
        color="#8B4513"
        roughness={0.9}
        metalness={0.1}
        onBeforeCompile={onBeforeCompile}
      />
    </instancedMesh>
  );
}
