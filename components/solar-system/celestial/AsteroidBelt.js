// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect, useState, useLayoutEffect, useCallback } from 'react';
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
  
  // Generate asteroid properties
  const { positionsAndScales, initialRotations, rotationSpeeds } = useMemo(() => {
    const initialRotations = new Float32Array(asteroidCount * 3);
    const rotationSpeeds = new Float32Array(asteroidCount * 3);
    const positionsAndScales = [];

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      positionsAndScales.push({
        x: Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5,
        y: heightVariation,
        z: Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5,
        scale: MathUtils.lerp(0.002, 0.008, Math.random()),
      });

      initialRotations[i * 3] = Math.random() * Math.PI;
      initialRotations[i * 3 + 1] = Math.random() * Math.PI;
      initialRotations[i * 3 + 2] = Math.random() * Math.PI;

      // Ensure 60FPS parity: (random - 0.5) * 0.02 was per-frame.
      rotationSpeeds[i * 3] = (Math.random() - 0.5) * 0.02 * 60.0;
      rotationSpeeds[i * 3 + 1] = (Math.random() - 0.5) * 0.02 * 60.0;
      rotationSpeeds[i * 3 + 2] = (Math.random() - 0.5) * 0.02 * 60.0;
    }

    return { positionsAndScales, initialRotations, rotationSpeeds };
  }, [asteroidCount]);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    
    positionsAndScales.forEach((item, i) => {
      tempObject.position.set(item.x, item.y, item.z);
      // Initialize matrix with no rotation
      tempObject.rotation.set(0, 0, 0);
      tempObject.scale.setScalar(item.scale);
      tempObject.updateMatrix();
      
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroidCount, positionsAndScales, tempObject]);

  const customShaderCompile = useCallback((shader) => {
    shader.uniforms.uTime = { value: 0 };
    // Assign to a ref so we can update it in useFrame
    if (materialRef.current) {
        materialRef.current.userData.shader = shader;
    }

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `
      #include <common>
      attribute vec3 aInitialRotation;
      attribute vec3 aRotationSpeed;
      uniform float uTime;

      mat4 eulerToRotationMatrix(vec3 euler) {
          float cx = cos(euler.x);
          float sx = sin(euler.x);
          float cy = cos(euler.y);
          float sy = sin(euler.y);
          float cz = cos(euler.z);
          float sz = sin(euler.z);

          // RotationZ * RotationY * RotationX
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
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>

      vec3 currentRotation = aInitialRotation + aRotationSpeed * uTime;
      mat4 rotMatrix = eulerToRotationMatrix(currentRotation);

      transformed = (rotMatrix * vec4(transformed, 1.0)).xyz;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `
      #include <beginnormal_vertex>

      vec3 currentRotationNormal = aInitialRotation + aRotationSpeed * uTime;
      mat4 rotMatrixNormal = eulerToRotationMatrix(currentRotationNormal);

      objectNormal = (rotMatrixNormal * vec4(objectNormal, 0.0)).xyz;
      `
    );
  }, []);

  useFrame((state) => {
    if (materialRef.current?.userData?.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

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
        onBeforeCompile={customShaderCompile}
      />
    </instancedMesh>
  );
}
