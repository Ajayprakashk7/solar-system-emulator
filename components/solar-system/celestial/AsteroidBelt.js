// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
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
  
  // Generate asteroid positions and properties
  const { asteroids, rotationSpeeds, rotationOffsets } = useMemo(() => {
    const asteroidData = [];
    const speeds = new Float32Array(asteroidCount * 3);
    const offsets = new Float32Array(asteroidCount * 3);

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      const y = heightVariation;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      const scale = MathUtils.lerp(0.002, 0.008, Math.random());

      asteroidData.push({ x, y, z, scale });

      // Rotation speeds
      speeds[i * 3] = (Math.random() - 0.5) * 0.02;     // X
      speeds[i * 3 + 1] = (Math.random() - 0.5) * 0.02; // Y
      speeds[i * 3 + 2] = (Math.random() - 0.5) * 0.02; // Z

      // Initial rotation offsets
      offsets[i * 3] = Math.random() * Math.PI;     // X
      offsets[i * 3 + 1] = Math.random() * Math.PI; // Y
      offsets[i * 3 + 2] = Math.random() * Math.PI; // Z
    }

    return { asteroids: asteroidData, rotationSpeeds: speeds, rotationOffsets: offsets };
  }, [asteroidCount]);

  // Initial placement
  useEffect(() => {
    if (!meshRef.current) return;
    
    asteroids.forEach((asteroid, i) => {
      // Set transform - Position and Scale ONLY
      // Rotation is handled in vertex shader, so we set rotation to 0 here
      tempObject.position.set(asteroid.x, asteroid.y, asteroid.z);
      tempObject.rotation.set(0, 0, 0);
      tempObject.scale.setScalar(asteroid.scale);
      tempObject.updateMatrix();
      
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroids, tempObject]);

  useFrame((state) => {
    // Update uTime uniform for shader-based rotation
    if (materialRef.current?.userData?.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const onBeforeCompile = useCallback((shader) => {
    shader.uniforms.uTime = { value: 0 };

    shader.vertexShader = `
      uniform float uTime;
      attribute vec3 aRotationSpeed;
      attribute vec3 aRotationOffset;
      ${shader.vertexShader}
    `;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>

      // Apply rotations in vertex shader
      vec3 rotated = transformed;

      // X Rotation
      float angleX = uTime * aRotationSpeed.x + aRotationOffset.x;
      float cx = cos(angleX); float sx = sin(angleX);
      rotated.yz = mat2(cx, -sx, sx, cx) * rotated.yz;

      // Y Rotation
      float angleY = uTime * aRotationSpeed.y + aRotationOffset.y;
      float cy = cos(angleY); float sy = sin(angleY);
      rotated.xz = mat2(cy, sy, -sy, cy) * rotated.xz;

      // Z Rotation
      float angleZ = uTime * aRotationSpeed.z + aRotationOffset.z;
      float cz = cos(angleZ); float sz = sin(angleZ);
      rotated.xy = mat2(cz, -sz, sz, cz) * rotated.xy;

      transformed = rotated;
      `
    );

    // Store shader to update uniforms
    if (materialRef.current) {
      materialRef.current.userData.shader = shader;
    }
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
         <instancedBufferAttribute
            attach="attributes-aRotationSpeed"
            args={[rotationSpeeds, 3]}
         />
         <instancedBufferAttribute
            attach="attributes-aRotationOffset"
            args={[rotationOffsets, 3]}
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
