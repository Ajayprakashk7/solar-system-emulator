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
  const { asteroids, rotationSpeeds } = useMemo(() => {
    const asteroidData = [];
    const speeds = new Float32Array(asteroidCount * 3);

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      asteroidData.push({
        x: Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5,
        y: heightVariation,
        z: Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5,
        scale: MathUtils.lerp(0.002, 0.008, Math.random()),
        rotationX: Math.random() * Math.PI,
        rotationY: Math.random() * Math.PI,
        rotationZ: Math.random() * Math.PI,
      });

      // Generate random rotation axis and speed
      // Random unit vector
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const axisX = Math.sin(phi) * Math.cos(theta);
      const axisY = Math.sin(phi) * Math.sin(theta);
      const axisZ = Math.cos(phi);

      // Speed (approx matching previous 0.02 rad/frame @ 60fps ~= 1.2 rad/sec max)
      const speed = (Math.random() * 0.5 + 0.2);

      speeds[i * 3] = axisX * speed;
      speeds[i * 3 + 1] = axisY * speed;
      speeds[i * 3 + 2] = axisZ * speed;
    }

    return { asteroids: asteroidData, rotationSpeeds: speeds };
  }, [asteroidCount]);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    
    asteroids.forEach((asteroid, i) => {
      // Set transform
      tempObject.position.set(asteroid.x, asteroid.y, asteroid.z);
      tempObject.rotation.set(asteroid.rotationX, asteroid.rotationY, asteroid.rotationZ);
      tempObject.scale.setScalar(asteroid.scale);
      tempObject.updateMatrix();
      
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroids, tempObject]);

  // Shader customization for GPU-based rotation
  const onBeforeCompile = useMemo(() => (shader) => {
    shader.uniforms.uTime = { value: 0 };
    // Store shader reference in userData to access it in useFrame
    if (materialRef.current) {
      materialRef.current.userData.shader = shader;
    }

    shader.vertexShader = `
      uniform float uTime;
      attribute vec3 aRotationSpeed;

      // Rodrigues rotation formula
      vec3 rotate(vec3 v, vec3 axis, float angle) {
        return v * cos(angle) + cross(axis, v) * sin(angle) + axis * dot(axis, v) * (1.0 - cos(angle));
      }
    ` + shader.vertexShader;

    // Inject rotation logic
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>

      float angle = length(aRotationSpeed) * uTime;
      if (angle > 0.0) {
        vec3 axis = normalize(aRotationSpeed);
        transformed = rotate(transformed, axis, angle);
      }
      `
    );

    // Rotate normals to ensure correct lighting
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `
      #include <beginnormal_vertex>

      float angleNormal = length(aRotationSpeed) * uTime;
      if (angleNormal > 0.0) {
        vec3 axisNormal = normalize(aRotationSpeed);
        objectNormal = rotate(objectNormal, axisNormal, angleNormal);
      }
      `
    );
  }, []);

  // Update time uniform for rotation animation
  useFrame((state) => {
    if (materialRef.current?.userData?.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
        <instancedBufferAttribute attach="attributes-aRotationSpeed" args={[rotationSpeeds, 3]} />
      </icosahedronGeometry>
      <meshStandardMaterial 
        ref={materialRef}
        onBeforeCompile={onBeforeCompile}
        color="#8B4513"
        roughness={0.9}
        metalness={0.1}
      />
    </instancedMesh>
  );
}
