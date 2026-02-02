// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect, useState, useLayoutEffect } from 'react';
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
  
  // Generate asteroid positions and properties
  const { initialData, attributes } = useMemo(() => {
    const initialData = [];
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

      initialData.push({ x, y, z, scale });

      // Attributes for GPU animation
      rotationSpeeds[i * 3] = (Math.random() - 0.5) * 0.02;     // X speed
      rotationSpeeds[i * 3 + 1] = (Math.random() - 0.5) * 0.02; // Y speed
      rotationSpeeds[i * 3 + 2] = (Math.random() - 0.5) * 0.02; // Z speed

      initialRotations[i * 3] = Math.random() * Math.PI;
      initialRotations[i * 3 + 1] = Math.random() * Math.PI;
      initialRotations[i * 3 + 2] = Math.random() * Math.PI;
    }

    return {
      initialData,
      attributes: {
        rotationSpeeds,
        initialRotations
      }
    };
  }, [asteroidCount]);

  useLayoutEffect(() => {
    if (!meshRef.current) return;

    // Set static positions and scales (Rotation is handled in shader)
    initialData.forEach((data, i) => {
      tempObject.position.set(data.x, data.y, data.z);
      tempObject.rotation.set(0, 0, 0); // Identity rotation
      tempObject.scale.setScalar(data.scale);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [initialData, tempObject]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  const onBeforeCompile = useMemo(() => (shader) => {
    shader.uniforms.uTime = uniforms.uTime;

    shader.vertexShader = `
      uniform float uTime;
      attribute vec3 aRotationSpeed;
      attribute vec3 aInitialRotation;

      // Euler rotation matrix (Z * Y * X)
      mat3 eulerRotate(vec3 rotation) {
          float cx = cos(rotation.x);
          float sx = sin(rotation.x);
          float cy = cos(rotation.y);
          float sy = sin(rotation.y);
          float cz = cos(rotation.z);
          float sz = sin(rotation.z);

          mat3 rx = mat3(
              1.0, 0.0, 0.0,
              0.0, cx, -sx,
              0.0, sx, cx
          );
          mat3 ry = mat3(
              cy, 0.0, sy,
              0.0, 1.0, 0.0,
              -sy, 0.0, cy
          );
          mat3 rz = mat3(
              cz, -sz, 0.0,
              sz, cz, 0.0,
              0.0, 0.0, 1.0
          );
          return rz * ry * rx;
      }
    ` + shader.vertexShader;

    // Inject rotation before the position is transformed
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>

      // Apply rotation animation
      // Multiplier 60.0 to match the original JS loop speed (approx 60fps)
      vec3 currentRotation = aInitialRotation + aRotationSpeed * uTime * 60.0;
      mat3 rotation = eulerRotate(currentRotation);

      transformed = rotation * transformed;
      `
    );

    // Also rotate normals so lighting is correct
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `
      #include <beginnormal_vertex>

      vec3 currentRotationNormal = aInitialRotation + aRotationSpeed * uTime * 60.0;
      mat3 rotationNormal = eulerRotate(currentRotationNormal);

      objectNormal = rotationNormal * objectNormal;
      `
    );
  }, [uniforms]);

  useFrame((state) => {
    if (uniforms.uTime) {
      uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
         <instancedBufferAttribute attach="attributes-aRotationSpeed" args={[attributes.rotationSpeeds, 3]} />
         <instancedBufferAttribute attach="attributes-aInitialRotation" args={[attributes.initialRotations, 3]} />
      </icosahedronGeometry>
      <meshStandardMaterial 
        color="#8B4513"
        roughness={0.9}
        metalness={0.1}
        onBeforeCompile={onBeforeCompile}
      />
    </instancedMesh>
  );
}
