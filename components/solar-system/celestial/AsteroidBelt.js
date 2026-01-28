// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect, useState, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils } from 'three';
import { nasaAPI } from '../services/nasaAPI';
import { nasaLogger } from '../../../lib/logger';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  // Using a stable object for uniforms to prevent re-compilation issues
  const uniforms = useRef({ uTime: { value: 0 } });

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
  const { asteroids, rotationSpeeds, initialRotations } = useMemo(() => {
    const asteroidsData = [];
    const speedBuffer = new Float32Array(asteroidCount * 3);
    const rotationBuffer = new Float32Array(asteroidCount * 3);

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      // Position and Scale
      asteroidsData.push({
        x: Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5,
        y: heightVariation,
        z: Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5,
        scale: MathUtils.lerp(0.002, 0.008, Math.random())
      });

      // Rotation Speed (random per axis)
      // Scaled to match original ~60FPS loop speed (approx 1.0 scale factor)
      speedBuffer[i * 3] = (Math.random() - 0.5) * 1.0;
      speedBuffer[i * 3 + 1] = (Math.random() - 0.5) * 1.0;
      speedBuffer[i * 3 + 2] = (Math.random() - 0.5) * 1.0;

      // Initial Rotation (random per axis)
      rotationBuffer[i * 3] = Math.random() * Math.PI;
      rotationBuffer[i * 3 + 1] = Math.random() * Math.PI;
      rotationBuffer[i * 3 + 2] = Math.random() * Math.PI;
    }

    return { asteroids: asteroidsData, rotationSpeeds: speedBuffer, initialRotations: rotationBuffer };
  }, [asteroidCount]);

  // Set initial positions and scales once
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    
    asteroids.forEach((asteroid, i) => {
      tempObject.position.set(asteroid.x, asteroid.y, asteroid.z);
      tempObject.scale.setScalar(asteroid.scale);
      tempObject.rotation.set(0, 0, 0); // Rotation handled in shader
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroids, tempObject]);

  // Update time uniform for rotation animation
  useFrame((state) => {
    if (uniforms.current.uTime) {
      uniforms.current.uTime.value = state.clock.getElapsedTime();
    }
  });

  const onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.current.uTime;

    shader.vertexShader = `
      attribute vec3 aRotationSpeed;
      attribute vec3 aInitialRotation;
      uniform float uTime;

      // Rotation matrix function
      mat4 rotationMatrix(vec3 axis, float angle) {
          axis = normalize(axis);
          float s = sin(angle);
          float c = cos(angle);
          float oc = 1.0 - c;

          return mat4(
              oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
              oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
              oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
              0.0,                                0.0,                                0.0,                                1.0
          );
      }
    ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>

      // Calculate rotation angles based on time and speed
      float angleX = aInitialRotation.x + aRotationSpeed.x * uTime;
      float angleY = aInitialRotation.y + aRotationSpeed.y * uTime;
      float angleZ = aInitialRotation.z + aRotationSpeed.z * uTime;

      // Construct rotation matrices
      mat4 rotX = rotationMatrix(vec3(1.0, 0.0, 0.0), angleX);
      mat4 rotY = rotationMatrix(vec3(0.0, 1.0, 0.0), angleY);
      mat4 rotZ = rotationMatrix(vec3(0.0, 0.0, 1.0), angleZ);

      // Apply rotations to the vertex position (before instance matrix)
      transformed = (rotZ * rotY * rotX * vec4(transformed, 1.0)).xyz;
      `
    );
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
        color="#8B4513"
        roughness={0.9}
        metalness={0.1}
        onBeforeCompile={onBeforeCompile}
      />
    </instancedMesh>
  );
}
