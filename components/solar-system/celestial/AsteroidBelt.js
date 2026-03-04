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
  
  // Typed arrays for GPU attributes
  const { initialRotations, rotationSpeeds } = useMemo(() => {
    const initialRotations = new Float32Array(asteroidCount * 3);
    const rotationSpeeds = new Float32Array(asteroidCount * 3);

    for (let i = 0; i < asteroidCount; i++) {
      const i3 = i * 3;
      initialRotations[i3] = Math.random() * Math.PI;
      initialRotations[i3 + 1] = Math.random() * Math.PI;
      initialRotations[i3 + 2] = Math.random() * Math.PI;
      
      // Apply 60.0 multiplier to match 60FPS loop execution
      rotationSpeeds[i3] = (Math.random() - 0.5) * 0.02 * 60.0;
      rotationSpeeds[i3 + 1] = (Math.random() - 0.5) * 0.02 * 60.0;
      rotationSpeeds[i3 + 2] = (Math.random() - 0.5) * 0.02 * 60.0;
    }

    return { initialRotations, rotationSpeeds };
  }, [asteroidCount]);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    
    const tempObject = new Object3D();
    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      const y = heightVariation;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      const scale = MathUtils.lerp(0.002, 0.008, Math.random());

      tempObject.position.set(x, y, z);
      tempObject.rotation.set(0, 0, 0); // Rotation handled on GPU
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroidCount]);

  useFrame((state) => {
    if (materialRef.current && materialRef.current.userData.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const onBeforeCompile = useCallback((shader) => {
    shader.uniforms.uTime = { value: 0 };
    if (materialRef.current) {
      materialRef.current.userData.shader = shader;
    }

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `
      #include <common>
      uniform float uTime;
      attribute vec3 aInitialRotation;
      attribute vec3 aRotationSpeed;

      mat3 rotationMatrix(vec3 angles) {
        float cx = cos(angles.x);
        float sx = sin(angles.x);
        float cy = cos(angles.y);
        float sy = sin(angles.y);
        float cz = cos(angles.z);
        float sz = sin(angles.z);

        mat3 rx = mat3(
          1.0, 0.0, 0.0,
          0.0, cx, sx,
          0.0, -sx, cx
        );
        mat3 ry = mat3(
          cy, 0.0, -sy,
          0.0, 1.0, 0.0,
          sy, 0.0, cy
        );
        mat3 rz = mat3(
          cz, sz, 0.0,
          -sz, cz, 0.0,
          0.0, 0.0, 1.0
        );
        return rz * ry * rx;
      }
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `
      #include <beginnormal_vertex>
      vec3 currentAngles = aInitialRotation + aRotationSpeed * uTime;
      mat3 rotMat = rotationMatrix(currentAngles);
      objectNormal = rotMat * objectNormal;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      transformed = rotMat * transformed;
      `
    );
  }, []);

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
