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
        nasaLogger.debug('Integration ready for enhanced asteroid positioning');
      }
    }).catch((error) => {
      nasaLogger.warn('Failed to fetch NEO data, using procedural generation:', error);
    });
  }, []);
  
  // Generate asteroid data for instancing
  const { positions, rotations, speeds } = useMemo(() => {
    const tempPositions = [];
    const tempRotations = [];
    const tempSpeeds = [];
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
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      tempPositions.push(tempObject.matrix.clone());

      tempRotations.push(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
      tempSpeeds.push((Math.random() - 0.5) * 1.0, (Math.random() - 0.5) * 1.0, (Math.random() - 0.5) * 1.0);
    }
    
    // Create TypedArrays for better performance
    const rotationsArray = new Float32Array(tempRotations);
    const speedsArray = new Float32Array(tempSpeeds);

    return {
      positions: tempPositions,
      rotations: rotationsArray,
      speeds: speedsArray
    };
  }, [asteroidCount, innerRadius, outerRadius]);

  useLayoutEffect(() => {
    if (meshRef.current) {
      positions.forEach((matrix, i) => meshRef.current.setMatrixAt(i, matrix));
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [positions]);

  useFrame((state) => {
    if (materialRef.current && materialRef.current.userData.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    materialRef.current.userData.shader = shader;

    // Common rotation logic
    const rotationLogic = `
      // Calculate rotation matrix
      float cx = cos(aRotation.x + aRotationSpeed.x * uTime);
      float sx = sin(aRotation.x + aRotationSpeed.x * uTime);
      mat3 rotX = mat3(1.0, 0.0, 0.0, 0.0, cx, -sx, 0.0, sx, cx);

      float cy = cos(aRotation.y + aRotationSpeed.y * uTime);
      float sy = sin(aRotation.y + aRotationSpeed.y * uTime);
      mat3 rotY = mat3(cy, 0.0, sy, 0.0, 1.0, 0.0, -sy, 0.0, cy);

      float cz = cos(aRotation.z + aRotationSpeed.z * uTime);
      float sz = sin(aRotation.z + aRotationSpeed.z * uTime);
      mat3 rotZ = mat3(cz, -sz, 0.0, sz, cz, 0.0, 0.0, 0.0, 1.0);

      mat3 rotationMat = rotZ * rotY * rotX;
    `;

    shader.vertexShader = `
      attribute vec3 aRotation;
      attribute vec3 aRotationSpeed;
      uniform float uTime;
    ` + shader.vertexShader;

    // Inject into beginnormal_vertex to rotate normals correctly
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `
        #include <beginnormal_vertex>
        ${rotationLogic}
        objectNormal = rotationMat * objectNormal;
      `
    );

    // Inject into begin_vertex to rotate positions
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
        #include <begin_vertex>
        // rotationMat is already calculated in beginnormal_vertex scope if we are careful,
        // but typically scope is shared in main().
        // However, to be safe and avoid "undefined variable", we re-declare or re-calculate.
        // But re-calculation is expensive.
        // Since both chunks are inside main(), we can rely on order IF we defined it in the first one.
        // But GLSL compiler might complain if it's inside a block scope {} of the include.
        // Three.js chunks are usually just lines of code, not blocks.
        // So 'rotationMat' should be available if defined in beginnormal_vertex.

        transformed = rotationMat * transformed;
      `
    );
  };

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
        <instancedBufferAttribute attach="attributes-aRotation" args={[rotations, 3]} />
        <instancedBufferAttribute attach="attributes-aRotationSpeed" args={[speeds, 3]} />
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
