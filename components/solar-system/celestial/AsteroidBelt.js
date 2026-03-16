// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils } from 'three';
import { nasaAPI } from '../services/nasaAPI';
import { nasaLogger } from '../../../lib/logger';

const AsteroidBelt = React.memo(function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
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
  
  // Generate asteroid positions and properties using Float32Array for WebGL performance
  const { instanceMatrix, rotationSpeeds } = useMemo(() => {
    const matrices = new Float32Array(asteroidCount * 16);
    const speeds = new Float32Array(asteroidCount * 3);
    const tempObj = new Object3D();

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      const y = heightVariation;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      const scale = MathUtils.lerp(0.002, 0.008, Math.random());
      
      tempObj.position.set(x, y, z);
      tempObj.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      tempObj.scale.setScalar(scale);
      tempObj.updateMatrix();
      
      // Store into Float32Array
      tempObj.matrix.toArray(matrices, i * 16);

      // Rotation speeds for the custom shader
      speeds[i * 3] = (Math.random() - 0.5) * 0.02;     // x
      speeds[i * 3 + 1] = (Math.random() - 0.5) * 0.02; // y
      speeds[i * 3 + 2] = (Math.random() - 0.5) * 0.02; // z
    }
    
    return { instanceMatrix: matrices, rotationSpeeds: speeds };
  }, [asteroidCount]); // innerRadius and outerRadius are constants inside the component, but we should probably lift them out or leave them here.

  const shaderUniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  useFrame((state) => {
    if (shaderUniforms.uTime) {
      shaderUniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const onBeforeCompile = useCallback((shader) => {
    shader.uniforms.uTime = shaderUniforms.uTime;

    shader.vertexShader = `
      attribute vec3 aRotationSpeed;
      uniform float uTime;

      ${shader.vertexShader}
    `.replace(
      `#include <begin_vertex>`,
      `
      // Create individual rotation matrices based on time and random speed
      vec3 currentRot = aRotationSpeed * uTime * 60.0;

      // Matrix builders
      mat4 rotX = mat4(
        1.0, 0.0, 0.0, 0.0,
        0.0, cos(currentRot.x), -sin(currentRot.x), 0.0,
        0.0, sin(currentRot.x), cos(currentRot.x), 0.0,
        0.0, 0.0, 0.0, 1.0
      );

      mat4 rotY = mat4(
        cos(currentRot.y), 0.0, sin(currentRot.y), 0.0,
        0.0, 1.0, 0.0, 0.0,
        -sin(currentRot.y), 0.0, cos(currentRot.y), 0.0,
        0.0, 0.0, 0.0, 1.0
      );

      mat4 rotZ = mat4(
        cos(currentRot.z), -sin(currentRot.z), 0.0, 0.0,
        sin(currentRot.z), cos(currentRot.z), 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
      );

      mat4 finalRot = rotZ * rotY * rotX;

      vec3 transformed = (finalRot * vec4(position, 1.0)).xyz;
      `
    );
  }, [shaderUniforms]);

  // Update instance matrix using a useLayoutEffect-like effect
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.instanceMatrix.array.set(instanceMatrix);
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [instanceMatrix]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
        <instancedBufferAttribute
          attach="attributes-aRotationSpeed"
          args={[rotationSpeeds, 3]}
        />
      </icosahedronGeometry>
      <meshStandardMaterial 
        color="#8B4513"
        roughness={0.9}
        metalness={0.1}
        onBeforeCompile={onBeforeCompile}
      />
    </instancedMesh>
  );
});

export default AsteroidBelt;
