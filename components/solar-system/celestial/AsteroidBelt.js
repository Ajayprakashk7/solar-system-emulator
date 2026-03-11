// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils } from 'three';
import * as THREE from 'three';
import { nasaAPI } from '../services/nasaAPI';
import { nasaLogger } from '../../../lib/logger';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  const tempObject = useMemo(() => new Object3D(), []);
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
  
  const materialRef = useRef();

  // Generate asteroid positions and properties
  const asteroids = useMemo(() => {
    return Array.from({ length: asteroidCount }, (_, i) => {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      return {
        x: Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5,
        y: heightVariation,
        z: Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5,
        scale: MathUtils.lerp(0.002, 0.008, Math.random()),
        rotationX: Math.random() * Math.PI,
        rotationY: Math.random() * Math.PI,
        rotationZ: Math.random() * Math.PI,
        rotationSpeedX: (Math.random() - 0.5) * 0.02,
        rotationSpeedY: (Math.random() - 0.5) * 0.02,
        rotationSpeedZ: (Math.random() - 0.5) * 0.02,
      };
    });
  }, [asteroidCount]);

  useFrame((state) => {
    if (materialRef.current && materialRef.current.userData.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  // Setup instance positions and custom attributes
  useEffect(() => {
    if (!meshRef.current) return;
    
    const initialRotations = new Float32Array(asteroidCount * 3);
    const rotationSpeeds = new Float32Array(asteroidCount * 3);

    asteroids.forEach((asteroid, i) => {
      // Set instance position and scale only (no rotation)
      tempObject.position.set(asteroid.x, asteroid.y, asteroid.z);
      tempObject.rotation.set(0, 0, 0); // Rotation will be handled in shader
      tempObject.scale.setScalar(asteroid.scale);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);

      // Store custom attributes
      initialRotations[i * 3] = asteroid.rotationX;
      initialRotations[i * 3 + 1] = asteroid.rotationY;
      initialRotations[i * 3 + 2] = asteroid.rotationZ;

      rotationSpeeds[i * 3] = asteroid.rotationSpeedX;
      rotationSpeeds[i * 3 + 1] = asteroid.rotationSpeedY;
      rotationSpeeds[i * 3 + 2] = asteroid.rotationSpeedZ;
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;

    // Add custom attributes to geometry
    const geometry = meshRef.current.geometry;
    geometry.setAttribute('aInitialRotation', new THREE.InstancedBufferAttribute(initialRotations, 3));
    geometry.setAttribute('aRotationSpeed', new THREE.InstancedBufferAttribute(rotationSpeeds, 3));
  }, [asteroids, asteroidCount, tempObject]);

  const handleBeforeCompile = useCallback((shader) => {
    shader.uniforms.uTime = { value: 0 };

    // Add custom attributes and uniforms
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `
      #include <common>
      uniform float uTime;
      attribute vec3 aInitialRotation;
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

      mat4 eulerToMatrix(vec3 euler) {
          float c1 = cos(euler.x); float s1 = sin(euler.x);
          float c2 = cos(euler.y); float s2 = sin(euler.y);
          float c3 = cos(euler.z); float s3 = sin(euler.z);

          mat4 rotX = mat4(
              1.0, 0.0, 0.0, 0.0,
              0.0, c1, s1, 0.0,
              0.0, -s1, c1, 0.0,
              0.0, 0.0, 0.0, 1.0
          );

          mat4 rotY = mat4(
              c2, 0.0, -s2, 0.0,
              0.0, 1.0, 0.0, 0.0,
              s2, 0.0, c2, 0.0,
              0.0, 0.0, 0.0, 1.0
          );

          mat4 rotZ = mat4(
              c3, s3, 0.0, 0.0,
              -s3, c3, 0.0, 0.0,
              0.0, 0.0, 1.0, 0.0,
              0.0, 0.0, 0.0, 1.0
          );

          return rotZ * rotY * rotX;
      }
      `
    );

    // Apply local rotation to vertices and normals
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>

      vec3 currentRotation = aInitialRotation + aRotationSpeed * uTime * 60.0;
      mat4 rotMat = eulerToMatrix(currentRotation);

      // Transform vertex
      transformed = (rotMat * vec4(transformed, 1.0)).xyz;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `
      #include <beginnormal_vertex>

      vec3 currentRotationN = aInitialRotation + aRotationSpeed * uTime * 60.0;
      mat4 rotMatN = eulerToMatrix(currentRotationN);

      // Transform normal
      objectNormal = (rotMatN * vec4(objectNormal, 0.0)).xyz;
      `
    );

    if (materialRef.current) {
      materialRef.current.userData.shader = shader;
    }
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial 
        ref={materialRef}
        color="#8B4513"
        roughness={0.9}
        metalness={0.1}
        onBeforeCompile={handleBeforeCompile}
      />
    </instancedMesh>
  );
}
