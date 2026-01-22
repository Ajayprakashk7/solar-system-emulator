// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect, useState } from 'react';
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

  // Generate data for instances
  const { initialMatrices, rotationSpeeds, randomOffsets } = useMemo(() => {
    const tempObject = new Object3D();
    const matrices = [];
    const speeds = new Float32Array(asteroidCount * 3);
    const offsets = new Float32Array(asteroidCount);

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      const y = heightVariation;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      const scale = MathUtils.lerp(0.002, 0.008, Math.random());

      // Initial random rotation
      const rotationX = Math.random() * Math.PI;
      const rotationY = Math.random() * Math.PI;
      const rotationZ = Math.random() * Math.PI;

      tempObject.position.set(x, y, z);
      tempObject.rotation.set(rotationX, rotationY, rotationZ);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      matrices.push(tempObject.matrix.clone());

      // GPU Animation data
      // Random rotation axis and speed
      // Normalize axis to ensure consistent rotation speed perception
      let axis = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
      const len = Math.sqrt(axis[0]**2 + axis[1]**2 + axis[2]**2);
      axis = axis.map(v => v / len);

      // Speed factor
      const speed = (Math.random() * 0.2 + 0.1); // Speed range

      speeds[i * 3] = axis[0] * speed;
      speeds[i * 3 + 1] = axis[1] * speed;
      speeds[i * 3 + 2] = axis[2] * speed;

      offsets[i] = Math.random() * Math.PI * 2;
    }

    return { initialMatrices: matrices, rotationSpeeds: speeds, randomOffsets: offsets };
  }, [asteroidCount]);

  // Set initial matrices once
  useEffect(() => {
    if (meshRef.current) {
      initialMatrices.forEach((matrix, i) => {
        meshRef.current.setMatrixAt(i, matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [initialMatrices]);

  // Custom shader to handle rotation in vertex shader
  const onBeforeCompile = useMemo(() => (shader) => {
    shader.uniforms.uTime = { value: 0 };
    
    // Store shader reference on the material userData so we can access it in useFrame
    // We cannot access materialRef.current here easily if this memo runs before ref assignment,
    // but the callback runs when material compiles.
    // However, the cleanest way is to attach it to the shader object itself which we can't easily reference outside.
    // Instead, we will rely on the fact that `materialRef.current` will be the material this runs on.
    if (materialRef.current) {
        materialRef.current.userData.shader = shader;
    }

    shader.vertexShader = `
      uniform float uTime;
      attribute vec3 aRotationSpeed;
      attribute float aRandomOffset;
      
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

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      
      // Calculate rotation
      float speed = length(aRotationSpeed);
      // Avoid division by zero
      if (speed > 0.0001) {
          vec3 axis = aRotationSpeed / speed;
          float angle = (uTime * speed) + aRandomOffset;
          mat4 rotMap = rotationMatrix(axis, angle);

          // Apply rotation to the local vertex position (transformed)
          // This happens BEFORE the instanceMatrix (position/scale) is applied by standard Three.js shader
          transformed = (rotMap * vec4(transformed, 1.0)).xyz;
      }
      `
    );
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
        <instancedBufferAttribute
            attach="attributes-aRandomOffset"
            args={[randomOffsets, 1]}
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
