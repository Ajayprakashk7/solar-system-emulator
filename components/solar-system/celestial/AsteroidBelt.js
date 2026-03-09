// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect, useState, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils } from 'three';
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
  const { positions, scales, initialRotations, rotationSpeeds } = useMemo(() => {
    const pos = new Float32Array(asteroidCount * 3);
    const scl = new Float32Array(asteroidCount);
    const initRot = new Float32Array(asteroidCount * 3);
    const rotSpeed = new Float32Array(asteroidCount * 3);

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      pos[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      pos[i * 3 + 1] = heightVariation;
      pos[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;

      scl[i] = MathUtils.lerp(0.002, 0.008, Math.random());

      initRot[i * 3] = Math.random() * Math.PI;
      initRot[i * 3 + 1] = Math.random() * Math.PI;
      initRot[i * 3 + 2] = Math.random() * Math.PI;

      rotSpeed[i * 3] = (Math.random() - 0.5) * 0.02 * 60;
      rotSpeed[i * 3 + 1] = (Math.random() - 0.5) * 0.02 * 60;
      rotSpeed[i * 3 + 2] = (Math.random() - 0.5) * 0.02 * 60;
    }

    return { positions: pos, scales: scl, initialRotations: initRot, rotationSpeeds: rotSpeed };
  }, [asteroidCount]);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    
    for (let i = 0; i < asteroidCount; i++) {
      tempObject.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      tempObject.rotation.set(0, 0, 0);
      tempObject.scale.setScalar(scales[i]);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroidCount, positions, scales, tempObject]);

  useFrame((state) => {
    if (materialRef.current && materialRef.current.userData.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    materialRef.current.userData.shader = shader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `
      #include <common>
      attribute vec3 aInitialRotation;
      attribute vec3 aRotationSpeed;
      uniform float uTime;

      mat4 rotationMatrix(vec3 euler) {
        float c1 = cos(euler.x);
        float s1 = sin(euler.x);
        float c2 = cos(euler.y);
        float s2 = sin(euler.y);
        float c3 = cos(euler.z);
        float s3 = sin(euler.z);

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

    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `
      #include <beginnormal_vertex>
      vec3 currentRotation = aInitialRotation + aRotationSpeed * uTime;
      mat4 localRot = rotationMatrix(currentRotation);
      objectNormal = (localRot * vec4(objectNormal, 0.0)).xyz;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      transformed = (localRot * vec4(transformed, 1.0)).xyz;
      `
    );
  };

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
        <instancedBufferAttribute attach="attributes-aInitialRotation" args={[initialRotations, 3]} />
        <instancedBufferAttribute attach="attributes-aRotationSpeed" args={[rotationSpeeds, 3]} />
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
