// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect, useState, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils } from 'three';
import * as THREE from 'three';
import { nasaAPI } from '../services/nasaAPI';
import { nasaLogger } from '../../../lib/logger';
import { useSpeedControl } from '../contexts/SpeedControlContext';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  const tempObject = useMemo(() => new Object3D(), []);
  const [neoData, setNeoData] = useState(null);
  const { speedFactor } = useSpeedControl();
  
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
  const asteroids = useMemo(() => {
    return Array.from({ length: asteroidCount }, (_, i) => {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      return {
        x: Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5,
        y: heightVariation,
        z: Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5,
        scale: MathUtils.lerp(0.002, 0.008, Math.random()),
        rotationX: Math.random() * Math.PI,
        rotationY: Math.random() * Math.PI,
        rotationZ: Math.random() * Math.PI,
        // Store rotation speed for shader
        rotationSpeed: (Math.random() - 0.5) * 0.5,
        randomPhase: Math.random() * Math.PI * 2
      };
    });
  }, [asteroidCount]);

  // OPTIMIZATION: Initialize matrices once.
  // We use useLayoutEffect to ensure they are set before the first paint.
  useLayoutEffect(() => {
    if (!meshRef.current) return;

    asteroids.forEach((asteroid, i) => {
      // Set static transform (position/scale)
      tempObject.position.set(asteroid.x, asteroid.y, asteroid.z);
      // Initial rotation
      tempObject.rotation.set(asteroid.rotationX, asteroid.rotationY, asteroid.rotationZ);
      tempObject.scale.setScalar(asteroid.scale);
      tempObject.updateMatrix();
      
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroids, tempObject]);

  // OPTIMIZATION: Use custom shader injection to handle rotation on GPU.
  // This restores the "tumbling" effect without CPU cost.
  const materialRef = useRef();

  const onBeforeCompile = useMemo(() => (shader) => {
    shader.uniforms.uTime = { value: 0 };
    materialRef.current.userData.shader = shader;

    shader.vertexShader = `
      uniform float uTime;
      attribute float aRotationSpeed;
      attribute float aRandomPhase;

      // Rotation matrix helper
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

    // Inject rotation logic before project_vertex
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>

      // Calculate rotation based on time, random phase and speed
      // We use a pseudo-random axis based on position for variety
      vec3 axis = normalize(vec3(sin(aRandomPhase), cos(aRandomPhase), sin(aRandomPhase * 2.0)));
      float angle = (uTime * aRotationSpeed) + aRandomPhase;
      mat4 rot = rotationMatrix(axis, angle);

      // Apply rotation to the vertex position (local space)
      transformed = (rot * vec4(transformed, 1.0)).xyz;

      // Correct normal for lighting
      objectNormal = (rot * vec4(objectNormal, 0.0)).xyz;
      `
    );
  }, []);

  // Set up attributes for the shader
  useLayoutEffect(() => {
    if (!meshRef.current) return;

    const count = asteroids.length;
    const rotationSpeeds = new Float32Array(count);
    const randomPhases = new Float32Array(count);

    asteroids.forEach((asteroid, i) => {
        rotationSpeeds[i] = asteroid.rotationSpeed;
        randomPhases[i] = asteroid.randomPhase;
    });

    meshRef.current.geometry.setAttribute('aRotationSpeed', new THREE.InstancedBufferAttribute(rotationSpeeds, 1));
    meshRef.current.geometry.setAttribute('aRandomPhase', new THREE.InstancedBufferAttribute(randomPhases, 1));
  }, [asteroids]);


  useFrame((state, delta) => {
    if (meshRef.current) {
      // Rotate the whole belt (Orbit)
      meshRef.current.rotation.y += delta * 0.02 * speedFactor;
    }

    // Update shader time for tumbling
    if (materialRef.current?.userData?.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.elapsedTime * speedFactor;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]} />
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
