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
        // Store rotation speeds for shader animation (radians per second)
        rotationSpeedX: (Math.random() - 0.5) * 1.0,
        rotationSpeedY: (Math.random() - 0.5) * 1.0,
        rotationSpeedZ: (Math.random() - 0.5) * 1.0,
      };
    });
  }, [asteroidCount]);

  // Generate instance attributes for shader animation
  const rotationSpeeds = useMemo(() => {
    const speeds = new Float32Array(asteroidCount * 3);
    asteroids.forEach((asteroid, i) => {
      speeds[i * 3] = asteroid.rotationSpeedX;
      speeds[i * 3 + 1] = asteroid.rotationSpeedY;
      speeds[i * 3 + 2] = asteroid.rotationSpeedZ;
    });
    return speeds;
  }, [asteroids, asteroidCount]);

  // Set initial static positions once
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

  // Animate using shader uniform instead of JS loop
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    materialRef.current = shader;

    shader.vertexShader = `
      uniform float uTime;
      attribute vec3 aRotationSpeed;

      // Rotate around X axis
      vec3 rotateX(vec3 v, float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return vec3(v.x, v.y * c - v.z * s, v.y * s + v.z * c);
      }

      // Rotate around Y axis
      vec3 rotateY(vec3 v, float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return vec3(v.x * c - v.z * s, v.y, v.x * s + v.z * c);
      }

      // Rotate around Z axis
      vec3 rotateZ(vec3 v, float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return vec3(v.x * c - v.y * s, v.x * s + v.y * c, v.z);
      }

      vec3 rotate(vec3 v, vec3 speeds, float time) {
         float tx = speeds.x * time;
         float ty = speeds.y * time;
         float tz = speeds.z * time;

         return rotateZ(rotateY(rotateX(v, tx), ty), tz);
      }
    ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>

      // Apply local rotation animation
      transformed = rotate(transformed, aRotationSpeed, uTime);

      #ifdef USE_NORMAL
        objectNormal = rotate(objectNormal, aRotationSpeed, uTime);
      #endif
      `
    );
  };

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
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
