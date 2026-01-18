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
  
  // Generate asteroid properties for GPU instancing
  const { initialRotations, rotationSpeeds } = useMemo(() => {
    const initialRotations = new Float32Array(asteroidCount * 3);
    const rotationSpeeds = new Float32Array(asteroidCount * 3);

    for (let i = 0; i < asteroidCount; i++) {
      // Initial rotation
      initialRotations[i * 3] = Math.random() * Math.PI;
      initialRotations[i * 3 + 1] = Math.random() * Math.PI;
      initialRotations[i * 3 + 2] = Math.random() * Math.PI;

      // Rotation speed
      rotationSpeeds[i * 3] = (Math.random() - 0.5) * 0.02;
      rotationSpeeds[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      rotationSpeeds[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    return { initialRotations, rotationSpeeds };
  }, [asteroidCount]);

  // Initial placement of asteroids
  useEffect(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      const y = heightVariation;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      const scale = MathUtils.lerp(0.002, 0.008, Math.random());

      // Set transform (Position and Scale only, Rotation handled by shader)
      tempObject.position.set(x, y, z);
      tempObject.rotation.set(0, 0, 0); // Identity rotation
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroidCount, innerRadius, outerRadius, tempObject]);

  // Animate shader uniform
  useFrame((state) => {
    if (materialRef.current?.userData?.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    // Store shader in userData so we can access it in useFrame
    if (materialRef.current) {
      materialRef.current.userData.shader = shader;
    }

    shader.vertexShader = `
      uniform float uTime;
      attribute vec3 aRotationSpeed;
      attribute vec3 aInitialRotation;

      mat3 rotateX(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat3(
          1.0, 0.0, 0.0,
          0.0, c, -s,
          0.0, s, c
        );
      }
      mat3 rotateY(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat3(
          c, 0.0, s,
          0.0, 1.0, 0.0,
          -s, 0.0, c
        );
      }
      mat3 rotateZ(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat3(
          c, -s, 0.0,
          s, c, 0.0,
          0.0, 0.0, 1.0
        );
      }

      ${shader.vertexShader}
    `;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>

      vec3 currentRotation = aInitialRotation + aRotationSpeed * uTime * 60.0;
      // Combine rotations: Z * Y * X
      mat3 rotMatrix = rotateZ(currentRotation.z) * rotateY(currentRotation.y) * rotateX(currentRotation.x);

      transformed = rotMatrix * transformed;
      `
    );
  };

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
        <instancedBufferAttribute
          attach="attributes-aInitialRotation"
          args={[initialRotations, 3]}
        />
        <instancedBufferAttribute
          attach="attributes-aRotationSpeed"
          args={[rotationSpeeds, 3]}
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
