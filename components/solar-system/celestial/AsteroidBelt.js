// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils } from 'three';
import { nasaAPI } from '../services/nasaAPI';
import { nasaLogger } from '../../../lib/logger';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
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
  
  // Generate asteroid positions and properties as Float32Arrays for GPU
  const { matrices, rotationAxes, rotationSpeeds } = useMemo(() => {
    const matrices = new Float32Array(asteroidCount * 16);
    const rotationAxes = new Float32Array(asteroidCount * 3);
    const rotationSpeeds = new Float32Array(asteroidCount);

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      const y = heightVariation;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      const scale = MathUtils.lerp(0.002, 0.008, Math.random());
      
      tempObject.position.set(x, y, z);
      tempObject.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      
      tempObject.matrix.toArray(matrices, i * 16);

      // Random rotation axis
      const ax = Math.random() - 0.5;
      const ay = Math.random() - 0.5;
      const az = Math.random() - 0.5;
      const length = Math.sqrt(ax * ax + ay * ay + az * az);

      rotationAxes[i * 3] = ax / length;
      rotationAxes[i * 3 + 1] = ay / length;
      rotationAxes[i * 3 + 2] = az / length;

      // Random rotation speed
      rotationSpeeds[i] = (Math.random() - 0.5) * 2.0; // Scaled for shader time
    }
    
    return { matrices, rotationAxes, rotationSpeeds };
  }, [asteroidCount, innerRadius, outerRadius, tempObject]);

  // Initialize instancedMesh matrices
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.instanceMatrix.array.set(matrices);
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [matrices]);

  // Custom shader to rotate instances on the GPU
  const onBeforeCompile = useMemo(() => (shader) => {
    shader.uniforms.uTime = { value: 0 };
    if (meshRef.current) {
      meshRef.current.userData.shader = shader;
    }

    shader.vertexShader = `
      uniform float uTime;
      attribute vec3 aRotationAxis;
      attribute float aRotationSpeed;

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

      ${shader.vertexShader}
    `.replace(
      `#include <beginnormal_vertex>`,
      `
      float angle = aRotationSpeed * uTime;
      mat4 rot = rotationMatrix(aRotationAxis, angle);
      vec3 objectNormal = (rot * vec4(normal, 0.0)).xyz;
      `
    ).replace(
      `#include <begin_vertex>`,
      `
      vec3 transformed = (rot * vec4(position, 1.0)).xyz;
      `
    );
  }, []);

  useFrame((state) => {
    if (meshRef.current && meshRef.current.userData.shader) {
      meshRef.current.userData.shader.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, asteroidCount]} userData={{}}>
      <icosahedronGeometry args={[1, 0]}>
        <instancedBufferAttribute
          attach="attributes-aRotationAxis"
          count={asteroidCount}
          array={rotationAxes}
          itemSize={3}
          args={[rotationAxes, 3]}
        />
        <instancedBufferAttribute
          attach="attributes-aRotationSpeed"
          count={asteroidCount}
          array={rotationSpeeds}
          itemSize={1}
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
