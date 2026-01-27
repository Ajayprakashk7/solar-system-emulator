// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react';
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
  
  // Generate asteroid positions and properties
  const { initialData, rotationSpeeds } = useMemo(() => {
    const data = [];
    const speeds = new Float32Array(asteroidCount * 3);

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      data.push({
        x: Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5,
        y: heightVariation,
        z: Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5,
        scale: MathUtils.lerp(0.002, 0.008, Math.random()),
        rotationX: Math.random() * Math.PI,
        rotationY: Math.random() * Math.PI,
        rotationZ: Math.random() * Math.PI,
      });

      // Store rotation speeds for shader (x, y, z)
      const i3 = i * 3;
      speeds[i3] = (Math.random() - 0.5) * 0.02;
      speeds[i3 + 1] = (Math.random() - 0.5) * 0.02;
      speeds[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    return { initialData: data, rotationSpeeds: speeds };
  }, [asteroidCount]);

  // Set initial instance matrices
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const tempObject = new Object3D();
    
    initialData.forEach((data, i) => {
      tempObject.position.set(data.x, data.y, data.z);
      tempObject.rotation.set(data.rotationX, data.rotationY, data.rotationZ);
      tempObject.scale.setScalar(data.scale);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [initialData]);

  // Shader customization for GPU-based rotation
  const onBeforeCompile = useCallback((shader) => {
    shader.uniforms.uTime = { value: 0 };

    // Store shader reference on material userData to access it in useFrame
    // We cannot use materialRef.current here directly because the material might not be fully attached yet
    // or this function is called before ref is populated.
    // But since we pass this to onBeforeCompile, we can't easily extract the shader instance out
    // unless we assign it to something.
    // React-Three-Fiber materials usually attach to the parent mesh, but here we have the material.
    // We'll rely on assigning it to the material's userData.

    shader.vertexShader = `
      attribute vec3 aRotationSpeed;
      uniform float uTime;

      vec2 rotate(vec2 v, float a) {
        float s = sin(a);
        float c = cos(a);
        return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
      }
    ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>

      // Apply rotation based on time and random speed
      // Multiply time by 60.0 to match original 60fps JS loop speed
      float time = uTime * 60.0;

      vec3 t = transformed;
      t.yz = rotate(t.yz, aRotationSpeed.x * time);
      t.xz = rotate(t.xz, aRotationSpeed.y * time);
      t.xy = rotate(t.xy, aRotationSpeed.z * time);
      transformed = t;
      `
    );

    // Assign shader to a known place so we can update uniforms
    if (materialRef.current) {
      materialRef.current.userData.shader = shader;
    }
  }, []);

  useFrame((state) => {
    if (materialRef.current?.userData?.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

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
