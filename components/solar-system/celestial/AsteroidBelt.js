// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils } from 'three';
import { nasaAPI } from '../services/nasaAPI';
import { nasaLogger } from '../../../lib/logger';

const AsteroidBelt = ({ asteroidCount = 500 }) => {
  const meshRef = useRef();
  const [neoData, setNeoData] = useState(null);
  
  // Custom material uniforms
  const uniforms = useMemo(() => ({
    time: { value: 0 }
  }), []);

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
  
  // Setup asteroid attributes for GPU
  const attributes = useMemo(() => {
    const tempObject = new Object3D();
    const matrices = new Float32Array(asteroidCount * 16);
    const rotationSpeeds = new Float32Array(asteroidCount * 3);
    const initialRotations = new Float32Array(asteroidCount * 3);

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      const y = heightVariation;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      const scale = MathUtils.lerp(0.002, 0.008, Math.random());

      tempObject.position.set(x, y, z);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      tempObject.matrix.toArray(matrices, i * 16);

      initialRotations[i * 3] = Math.random() * Math.PI * 2;
      initialRotations[i * 3 + 1] = Math.random() * Math.PI * 2;
      initialRotations[i * 3 + 2] = Math.random() * Math.PI * 2;

      rotationSpeeds[i * 3] = (Math.random() - 0.5) * 2.0;
      rotationSpeeds[i * 3 + 1] = (Math.random() - 0.5) * 2.0;
      rotationSpeeds[i * 3 + 2] = (Math.random() - 0.5) * 2.0;
    }

    return { matrices, initialRotations, rotationSpeeds };
  }, [asteroidCount]);

  // Bind matrices once when attributes change
  useEffect(() => {
    if (meshRef.current && attributes) {
      meshRef.current.instanceMatrix.array.set(attributes.matrices);
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [attributes]);

  const handleBeforeCompile = useCallback((shader) => {
    shader.uniforms.time = uniforms.time;
    
    // Inject custom attributes
    shader.vertexShader = `
      uniform float time;
      attribute vec3 aRotationSpeed;
      attribute vec3 aInitialRotation;
      
      // Helper function to create rotation matrix from euler angles
      mat4 rotationMatrix(vec3 euler) {
        float cx = cos(euler.x);
        float sx = sin(euler.x);
        float cy = cos(euler.y);
        float sy = sin(euler.y);
        float cz = cos(euler.z);
        float sz = sin(euler.z);

        mat4 rotX = mat4(
          1.0, 0.0, 0.0, 0.0,
          0.0, cx, sx, 0.0,
          0.0, -sx, cx, 0.0,
          0.0, 0.0, 0.0, 1.0
        );

        mat4 rotY = mat4(
          cy, 0.0, -sy, 0.0,
          0.0, 1.0, 0.0, 0.0,
          sy, 0.0, cy, 0.0,
          0.0, 0.0, 0.0, 1.0
        );

        mat4 rotZ = mat4(
          cz, sz, 0.0, 0.0,
          -sz, cz, 0.0, 0.0,
          0.0, 0.0, 1.0, 0.0,
          0.0, 0.0, 0.0, 1.0
        );

        return rotZ * rotY * rotX;
      }
      
      ${shader.vertexShader}
    `;

    // Replace transform block to apply dynamic rotation
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `
      vec3 currentRotation = aInitialRotation + aRotationSpeed * time;
      mat4 dynRotation = rotationMatrix(currentRotation);

      // Apply rotation to normals
      vec3 objectNormal = (dynRotation * vec4(normal, 0.0)).xyz;
      `
    );
    
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      // Apply rotation to positions
      vec3 transformed = (dynRotation * vec4(position, 1.0)).xyz;
      `
    );

    if (meshRef.current) {
      meshRef.current.userData.shader = shader;
    }
  }, [uniforms]);

  useFrame((state) => {
    uniforms.time.value = state.clock.elapsedTime;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
        <instancedBufferAttribute
          attach="attributes-aInitialRotation"
          args={[attributes.initialRotations, 3]}
        />
        <instancedBufferAttribute
          attach="attributes-aRotationSpeed"
          args={[attributes.rotationSpeeds, 3]}
        />
      </icosahedronGeometry>
      <meshStandardMaterial 
        color="#8B4513"
        roughness={0.9}
        metalness={0.1}
        onBeforeCompile={handleBeforeCompile}
        userData={{}} // Required for onBeforeCompile shader reference
      />
    </instancedMesh>
  );
};

export default React.memo(AsteroidBelt);
