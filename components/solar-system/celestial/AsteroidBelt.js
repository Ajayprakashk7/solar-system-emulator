// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter with GPU instantiation
'use client';
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils } from 'three';
import { nasaAPI } from '../services/nasaAPI';
import { nasaLogger } from '../../../lib/logger';

function AsteroidBeltComponent({ asteroidCount = 500 }) {
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
      }
    }).catch((error) => {
      nasaLogger.warn('Failed to fetch NEO data, using procedural generation:', error);
    });
  }, []);
  
  // GPU instancing arrays
  const { rotationSpeeds, initialMatrices } = useMemo(() => {
    const tempObject = new Object3D();
    const scales = new Float32Array(asteroidCount);
    const rotationSpeeds = new Float32Array(asteroidCount * 3);
    const initialMatrices = new Float32Array(asteroidCount * 16);

    // Extract NEO scale data if available
    let neoScales = [];
    if (neoData && neoData.near_earth_objects) {
      const dates = Object.keys(neoData.near_earth_objects);
      for (const date of dates) {
        for (const neo of neoData.near_earth_objects[date]) {
          if (neo.estimated_diameter?.kilometers?.estimated_diameter_max) {
             // Map diameter (typically 0.1 to 10 km) to 3D scale
             neoScales.push(MathUtils.clamp(neo.estimated_diameter.kilometers.estimated_diameter_max * 0.002, 0.001, 0.015));
          }
        }
      }
    }

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      const y = heightVariation;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;

      // Use NEO data for scale if available, else procedural
      let scale = MathUtils.lerp(0.002, 0.008, Math.random());
      if (neoScales.length > 0) {
        scale = neoScales[i % neoScales.length] * MathUtils.lerp(0.8, 1.2, Math.random());
      }
      scales[i] = scale;

      const rotX = Math.random() * Math.PI;
      const rotY = Math.random() * Math.PI;
      const rotZ = Math.random() * Math.PI;

      rotationSpeeds[i * 3] = (Math.random() - 0.5) * 2.0;
      rotationSpeeds[i * 3 + 1] = (Math.random() - 0.5) * 2.0;
      rotationSpeeds[i * 3 + 2] = (Math.random() - 0.5) * 2.0;

      tempObject.position.set(x, y, z);
      tempObject.rotation.set(rotX, rotY, rotZ);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();

      tempObject.matrix.toArray(initialMatrices, i * 16);
    }

    return { rotationSpeeds, initialMatrices };
  }, [asteroidCount, neoData]);

  // Apply initial matrices
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.instanceMatrix.array.set(initialMatrices);
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [initialMatrices]);

  const onBeforeCompile = useCallback((shader) => {
    shader.uniforms.uTime = { value: 0 };
    
    shader.vertexShader = `
      uniform float uTime;
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
    ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      
      // Calculate rotation based on speed and time
      float speed = length(aRotationSpeed);
      if (speed > 0.0) {
        mat4 rot = rotationMatrix(aRotationSpeed, speed * uTime);
        transformed = (rot * vec4(transformed, 1.0)).xyz;
      }
      `
    );
    
    materialRef.current.userData.shader = shader;
  }, []);

  useFrame((state) => {
    if (materialRef.current?.userData?.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
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

export default React.memo(AsteroidBeltComponent);
