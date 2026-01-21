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
  
  // Generate asteroid data and static matrices
  const { initialRotations, rotationSpeeds, matrices } = useMemo(() => {
    const initialRotations = new Float32Array(asteroidCount * 3);
    const rotationSpeeds = new Float32Array(asteroidCount * 3);
    const matrices = new Float32Array(asteroidCount * 16);

    const tempObject = new Object3D();

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      const y = heightVariation;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      const scale = MathUtils.lerp(0.002, 0.008, Math.random());

      // Store rotation data for shader
      initialRotations[i * 3] = Math.random() * Math.PI;
      initialRotations[i * 3 + 1] = Math.random() * Math.PI;
      initialRotations[i * 3 + 2] = Math.random() * Math.PI;

      rotationSpeeds[i * 3] = (Math.random() - 0.5) * 0.02;
      rotationSpeeds[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      rotationSpeeds[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      // Set transform (Position & Scale only, Rotation is handled in shader)
      tempObject.position.set(x, y, z);
      tempObject.rotation.set(0, 0, 0);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();

      tempObject.matrix.toArray(matrices, i * 16);
    }

    return { initialRotations, rotationSpeeds, matrices };
  }, [asteroidCount]);

  // Apply matrices once
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.instanceMatrix.array.set(matrices);
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [matrices]);

  // Update time uniform
  useFrame((state) => {
    if (materialRef.current && materialRef.current.uTime) {
      // Use a time multiplier to match the original speed roughly (60fps)
      // Original: rotation += speed (per frame)
      // Shader: rotation = initial + speed * time * 60.0
      materialRef.current.uTime.value = state.clock.getElapsedTime() * 60.0;
    }
  });

  const onBeforeCompile = useCallback((shader) => {
    shader.uniforms.uTime = { value: 0 };
    materialRef.current = shader.uniforms; // Keep reference to uniforms to update them
    
    // Inject attributes and uniform
    shader.vertexShader = `
      attribute vec3 aInitialRotation;
      attribute vec3 aRotationSpeed;
      uniform float uTime;
      
      // Euler rotation function (XYZ order)
      vec3 rotate(vec3 v, vec3 angles) {
        vec3 c = cos(angles);
        vec3 s = sin(angles);

        // Rotate around X
        mat3 rx = mat3(1.0, 0.0, 0.0,
                       0.0, c.x, -s.x,
                       0.0, s.x, c.x);

        // Rotate around Y
        mat3 ry = mat3(c.y, 0.0, s.y,
                       0.0, 1.0, 0.0,
                       -s.y, 0.0, c.y);

        // Rotate around Z
        mat3 rz = mat3(c.z, -s.z, 0.0,
                       s.z, c.z, 0.0,
                       0.0, 0.0, 1.0);

        return rz * ry * rx * v;
      }
    ` + shader.vertexShader;

    // Inject rotation logic before normal and position transformations
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      
      vec3 currentRotation = aInitialRotation + aRotationSpeed * uTime;
      transformed = rotate(transformed, currentRotation);
      `
    );
    
    shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        `
        #include <beginnormal_vertex>

        // We need to rotate normals too!
        vec3 currentRotationNormal = aInitialRotation + aRotationSpeed * uTime;
        objectNormal = rotate(objectNormal, currentRotationNormal);
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
        color="#8B4513"
        roughness={0.9}
        metalness={0.1}
        onBeforeCompile={onBeforeCompile}
      />
    </instancedMesh>
  );
}
