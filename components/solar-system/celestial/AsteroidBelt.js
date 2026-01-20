// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils } from 'three';
import { nasaAPI } from '../services/nasaAPI';
import { nasaLogger } from '../../../lib/logger';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  
  // Asteroid belt parameters (between Mars ~1.5 AU and Jupiter ~5.2 AU)
  const innerRadius = 3.5;
  const outerRadius = 4.8;
  
  // Optionally fetch real Near-Earth Object data from NASA
  useEffect(() => {
    nasaAPI.getNearEarthObjects().then((data) => {
      if (data?.element_count > 0) {
        nasaLogger.debug(`Loaded ${data.element_count} near-Earth objects`);
        // Future enhancement: Use data to position asteroids based on real orbital data
        nasaLogger.debug('Integration ready for enhanced asteroid positioning');
      }
    }).catch((error) => {
      nasaLogger.warn('Failed to fetch NEO data, using procedural generation:', error);
    });
  }, []);
  
  // Generate asteroid data and attributes
  const { matrices, rotationAxes, rotationSpeeds } = useMemo(() => {
    const tempObject = new Object3D();
    const matrices = new Float32Array(asteroidCount * 16);
    const axes = new Float32Array(asteroidCount * 3);
    const speeds = new Float32Array(asteroidCount);

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      const y = heightVariation;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;

      tempObject.position.set(x, y, z);

      // Initial random rotation
      tempObject.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      tempObject.scale.setScalar(MathUtils.lerp(0.002, 0.008, Math.random()));
      tempObject.updateMatrix();
      tempObject.matrix.toArray(matrices, i * 16);

      // Random rotation axis
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      axes[i * 3] = Math.sin(phi) * Math.cos(theta);
      axes[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
      axes[i * 3 + 2] = Math.cos(phi);

      // Random rotation speed (approximate the original JS speed logic)
      speeds[i] = (Math.random() * 0.2 + 0.1) * (Math.random() < 0.5 ? -1 : 1);
    }

    return { matrices, rotationAxes: axes, rotationSpeeds: speeds };
  }, [asteroidCount]);

  // Set instance matrices on mount/change
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.instanceMatrix.array.set(matrices);
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [matrices]);

  // Custom shader for GPU-based rotation
  const onBeforeCompile = useMemo(() => (shader) => {
    shader.uniforms.uTime = { value: 0 };
    
    shader.vertexShader = `
      uniform float uTime;
      attribute vec3 aRotationAxis;
      attribute float aRotationSpeed;
      
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
      
      ${shader.vertexShader}
    `;
    
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>

      // Apply rotation animation
      // 60.0 time multiplier to match original 60FPS loop speed approx
      float angle = aRotationSpeed * uTime * 60.0;
      mat4 rotMat = rotationMatrix(aRotationAxis, angle);

      vec3 transformedRotated = (rotMat * vec4(transformed, 1.0)).xyz;
      transformed = transformedRotated;
      `
    );

    meshRef.current.material.userData.shader = shader;
  }, []);

  useFrame((state) => {
    if (meshRef.current?.material?.userData?.shader) {
      meshRef.current.material.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
        <instancedBufferAttribute
          attach="attributes-aRotationAxis"
          args={[rotationAxes, 3]}
        />
        <instancedBufferAttribute
          attach="attributes-aRotationSpeed"
          args={[rotationSpeeds, 1]}
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
