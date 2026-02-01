// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect, useState, useLayoutEffect } from 'react';
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
  
  // Generate asteroid positions and properties
  const { positions, scales, rotationSpeeds, initialRotations } = useMemo(() => {
    const posArray = new Float32Array(asteroidCount * 3);
    const scaleArray = new Float32Array(asteroidCount);
    const speedArray = new Float32Array(asteroidCount * 3);
    const initRotArray = new Float32Array(asteroidCount * 3);

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      // Position
      posArray[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      posArray[i * 3 + 1] = heightVariation;
      posArray[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;

      // Scale
      scaleArray[i] = MathUtils.lerp(0.002, 0.008, Math.random());

      // Initial Rotation
      initRotArray[i * 3] = Math.random() * Math.PI;
      initRotArray[i * 3 + 1] = Math.random() * Math.PI;
      initRotArray[i * 3 + 2] = Math.random() * Math.PI;

      // Rotation Speed
      speedArray[i * 3] = (Math.random() - 0.5) * 0.02;
      speedArray[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      speedArray[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    return {
      positions: posArray,
      scales: scaleArray,
      rotationSpeeds: speedArray,
      initialRotations: initRotArray
    };
  }, [asteroidCount]);

  // Update instance matrices for static transforms (Position & Scale)
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    
    const tempObject = new Object3D();

    for (let i = 0; i < asteroidCount; i++) {
      tempObject.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      tempObject.scale.setScalar(scales[i]);
      tempObject.rotation.set(0, 0, 0); // Rotation handled in shader
      tempObject.updateMatrix();
      
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroidCount, positions, scales]);

  // Animate via shader uniform
  useFrame((state) => {
    if (materialRef.current?.userData?.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };

    shader.vertexShader = `
      uniform float uTime;
      attribute vec3 aRotationSpeed;
      attribute vec3 aInitialRotation;

      mat3 getRotationMatrix(vec3 rotation) {
        float cx = cos(rotation.x);
        float sx = sin(rotation.x);
        float cy = cos(rotation.y);
        float sy = sin(rotation.y);
        float cz = cos(rotation.z);
        float sz = sin(rotation.z);

        // Z * Y * X
        return mat3(
          cz*cy, cz*sy*sx - sz*cx, cz*sy*cx + sz*sx,
          sz*cy, sz*sy*sx + cz*cx, sz*sy*cx - cz*sx,
          -sy,   cy*sx,            cy*cx
        );
      }
    ` + shader.vertexShader;

    // Apply rotation to Normals
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `
      #include <beginnormal_vertex>

      vec3 currentRot_norm = aInitialRotation + aRotationSpeed * uTime * 60.0;
      mat3 rotMatrix_norm = getRotationMatrix(currentRot_norm);

      objectNormal = rotMatrix_norm * objectNormal;

      #ifdef USE_TANGENT
        objectTangent = rotMatrix_norm * objectTangent;
      #endif
      `
    );

    // Apply rotation to Position
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>

      vec3 currentRot_pos = aInitialRotation + aRotationSpeed * uTime * 60.0;
      mat3 rotMatrix_pos = getRotationMatrix(currentRot_pos);

      transformed = rotMatrix_pos * transformed;
      `
    );

    materialRef.current.userData.shader = shader;
  };

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
