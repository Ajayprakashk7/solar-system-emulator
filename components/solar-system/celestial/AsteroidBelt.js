// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect, useState } from 'react';
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
  
  // Define asteroid geometry matrices in a Float32Array to offload to the GPU
  const [instanceMatrix, rotationSpeeds] = useMemo(() => {
    const matrices = new Float32Array(asteroidCount * 16);
    const speeds = new Float32Array(asteroidCount * 3);

    let neoIndex = 0;
    const neos = neoData?.near_earth_objects ? Object.values(neoData.near_earth_objects).flat() : [];

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      const y = heightVariation;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      
      // Determine scale based on real NEO data if available
      let scale = MathUtils.lerp(0.002, 0.008, Math.random());
      if (neos.length > 0) {
        const neo = neos[neoIndex % neos.length];
        const diameterKm = neo?.estimated_diameter?.kilometers?.estimated_diameter_max || 1;
        // Map 1km-10km to our procedural scale (roughly 0.002 to 0.02)
        scale = MathUtils.clamp(diameterKm * 0.002, 0.002, 0.02);
        neoIndex++;
      }

      const rotX = Math.random() * Math.PI;
      const rotY = Math.random() * Math.PI;
      const rotZ = Math.random() * Math.PI;

      tempObject.position.set(x, y, z);
      tempObject.rotation.set(rotX, rotY, rotZ);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      
      tempObject.matrix.toArray(matrices, i * 16);

      speeds[i * 3] = (Math.random() - 0.5) * 2.0;
      speeds[i * 3 + 1] = (Math.random() - 0.5) * 2.0;
      speeds[i * 3 + 2] = (Math.random() - 0.5) * 2.0;
    }
    
    return [matrices, speeds];
  }, [asteroidCount, neoData, tempObject]);

  // Bind matrices when geometry array changes
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.instanceMatrix.array.set(instanceMatrix);
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [instanceMatrix]);

  const customMaterial = useMemo(() => {
    return {
      userData: {},
      onBeforeCompile: (shader) => {
        shader.uniforms.uTime = { value: 0 };
        shader.vertexShader = `
          uniform float uTime;
          attribute vec3 aRotationSpeed;
          ${shader.vertexShader}
        `.replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>

          // Simplified quaternion rotation
          float cx = cos(aRotationSpeed.x * uTime);
          float sx = sin(aRotationSpeed.x * uTime);
          float cy = cos(aRotationSpeed.y * uTime);
          float sy = sin(aRotationSpeed.y * uTime);
          float cz = cos(aRotationSpeed.z * uTime);
          float sz = sin(aRotationSpeed.z * uTime);

          mat3 rotX = mat3(
            1.0, 0.0, 0.0,
            0.0, cx, -sx,
            0.0, sx, cx
          );

          mat3 rotY = mat3(
            cy, 0.0, sy,
            0.0, 1.0, 0.0,
            -sy, 0.0, cy
          );

          mat3 rotZ = mat3(
            cz, -sz, 0.0,
            sz, cz, 0.0,
            0.0, 0.0, 1.0
          );

          transformed = rotZ * rotY * rotX * transformed;
          `
        );
        customMaterial.userData.shader = shader;
      }
    };
  }, []);

  useFrame((state) => {
    if (customMaterial.userData?.shader) {
      customMaterial.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
        <instancedBufferAttribute
          attach="attributes-aRotationSpeed"
          count={asteroidCount}
          array={rotationSpeeds}
          itemSize={3}
        />
      </icosahedronGeometry>
      <meshStandardMaterial 
        color="#8B4513"
        roughness={0.9}
        metalness={0.1}
        onBeforeCompile={customMaterial.onBeforeCompile}
      />
    </instancedMesh>
  );
}
