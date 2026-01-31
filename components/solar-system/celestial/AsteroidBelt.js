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
  
  // Generate asteroid static properties and rotation speeds
  const { initialTransforms, rotationSpeeds } = useMemo(() => {
    const speeds = new Float32Array(asteroidCount * 3);
    const transforms = [];

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      transforms.push({
        x: Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5,
        y: heightVariation,
        z: Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5,
        scale: MathUtils.lerp(0.002, 0.008, Math.random()),
        rotationX: Math.random() * Math.PI,
        rotationY: Math.random() * Math.PI,
        rotationZ: Math.random() * Math.PI,
      });

      // Rotation speeds (rad/frame in original, converting to rad/sec approx if 60fps)
      // Original: (Math.random() - 0.5) * 0.02 per frame.
      // 0.02 * 60 = 1.2 rad/sec range.
      // We use a simpler random range here.
      speeds[i * 3] = (Math.random() - 0.5) * 1.5;
      speeds[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
      speeds[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }

    return { initialTransforms: transforms, rotationSpeeds: speeds };
  }, [asteroidCount]);

  // Set initial instance matrices once
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const tempObject = new Object3D();

    initialTransforms.forEach((data, i) => {
      tempObject.position.set(data.x, data.y, data.z);
      tempObject.rotation.set(data.rotationX, data.rotationY, data.rotationZ);
      tempObject.scale.setScalar(data.scale);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [initialTransforms]);

  // Animate via shader uniform
  useFrame((state) => {
    if (materialRef.current?.userData?.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const onBeforeCompile = useCallback((shader) => {
    shader.uniforms.uTime = { value: 0 };
    // Store shader reference for useFrame updates
    if (materialRef.current) {
      materialRef.current.userData.shader = shader;
    }

    shader.vertexShader = `
      attribute vec3 aRotationSpeed;
      uniform float uTime;

      // Simple Euler rotation (independent axes)
      vec3 rotateVector(vec3 v, vec3 r) {
        // Rotate Z
        float s = sin(r.z); float c = cos(r.z);
        float x = v.x; float y = v.y;
        v.x = x * c - y * s;
        v.y = x * s + y * c;

        // Rotate Y
        s = sin(r.y); c = cos(r.y);
        x = v.x; float z = v.z;
        v.x = x * c + z * s;
        v.z = -x * s + z * c;

        // Rotate X
        s = sin(r.x); c = cos(r.x);
        y = v.y; z = v.z;
        v.y = y * c - z * s;
        v.z = y * s + z * c;
        return v;
      }
    ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>

      // Apply rotation based on speed and time
      // This rotates the local vertex before the instance matrix (which includes placement and initial rotation)
      transformed = rotateVector(transformed, aRotationSpeed * uTime);
      `
    );
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
        <instancedBufferAttribute
          attach="attributes-aRotationSpeed"
          args={[rotationSpeeds, 3]}
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
