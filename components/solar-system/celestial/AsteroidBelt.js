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
  
  // GPU-accelerated asteroid data
  const { matrixArray, rotationSpeeds } = useMemo(() => {
    const tempObject = new Object3D();
    const matrixArray = new Float32Array(asteroidCount * 16);
    const rotationSpeeds = new Float32Array(asteroidCount * 3);

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      const y = heightVariation;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      const scale = MathUtils.lerp(0.002, 0.008, Math.random());
      const rotationX = Math.random() * Math.PI;
      const rotationY = Math.random() * Math.PI;
      const rotationZ = Math.random() * Math.PI;
      
      tempObject.position.set(x, y, z);
      tempObject.rotation.set(rotationX, rotationY, rotationZ);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      tempObject.matrix.toArray(matrixArray, i * 16);
      
      rotationSpeeds[i * 3] = (Math.random() - 0.5) * 0.02;     // rx speed
      rotationSpeeds[i * 3 + 1] = (Math.random() - 0.5) * 0.02; // ry speed
      rotationSpeeds[i * 3 + 2] = (Math.random() - 0.5) * 0.02; // rz speed
    }
    
    return { matrixArray, rotationSpeeds };
  }, [asteroidCount]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.instanceMatrix.array.set(matrixArray);
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [matrixArray]);

  useFrame((state) => {
    if (materialRef.current?.userData?.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const handleBeforeCompile = useCallback((shader) => {
    shader.uniforms.uTime = { value: 0 };
    materialRef.current.userData.shader = shader;

    shader.vertexShader = `
      uniform float uTime;
      attribute vec3 aRotationSpeed;
      ${shader.vertexShader}
    `;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      // Calculate rotation based on speeds
      vec3 currentRot = aRotationSpeed * uTime * 60.0;

      float cx = cos(currentRot.x);
      float sx = sin(currentRot.x);
      float cy = cos(currentRot.y);
      float sy = sin(currentRot.y);
      float cz = cos(currentRot.z);
      float sz = sin(currentRot.z);

      // Rotation matrices
      mat3 rotX = mat3(
        1.0, 0.0, 0.0,
        0.0, cx, sx,
        0.0, -sx, cx
      );

      mat3 rotY = mat3(
        cy, 0.0, -sy,
        0.0, 1.0, 0.0,
        sy, 0.0, cy
      );

      mat3 rotZ = mat3(
        cz, sz, 0.0,
        -sz, cz, 0.0,
        0.0, 0.0, 1.0
      );

      // Combine rotations and apply to local position
      vec3 transformed = position;
      transformed = rotZ * rotY * rotX * transformed;
      `
    );
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]}>
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
        onBeforeCompile={handleBeforeCompile}
        userData={{}}
      />
    </instancedMesh>
  );
}
