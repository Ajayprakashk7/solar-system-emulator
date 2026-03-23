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
  
  // Pre-calculate matrices and attributes for the GPU
  const { instanceMatrix, rotationSpeeds } = useMemo(() => {
    const matrixArray = new Float32Array(asteroidCount * 16);
    const speedsArray = new Float32Array(asteroidCount * 3);

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      const y = heightVariation;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      const scale = MathUtils.lerp(0.002, 0.008, Math.random());
      
      const rotationX = Math.random() * Math.PI;
      const rotationY = Math.random() * Math.PI;
      const rotationZ = Math.random() * Math.PI;

      tempObject.position.set(x, y, z);
      tempObject.rotation.set(rotationX, rotationY, rotationZ);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      
      tempObject.matrix.toArray(matrixArray, i * 16);

      // Store rotation speeds for the vertex shader
      speedsArray[i * 3] = (Math.random() - 0.5) * 0.02;     // speedX
      speedsArray[i * 3 + 1] = (Math.random() - 0.5) * 0.02; // speedY
      speedsArray[i * 3 + 2] = (Math.random() - 0.5) * 0.02; // speedZ
    }
    return { instanceMatrix: matrixArray, rotationSpeeds: speedsArray };
  }, [asteroidCount, tempObject, innerRadius, outerRadius]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.instanceMatrix.array.set(instanceMatrix);
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [instanceMatrix]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.getElapsedTime();
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, asteroidCount]} frustumCulled={true}>
      <icosahedronGeometry args={[1, 0]}>
        <instancedBufferAttribute attach="attributes-aRotationSpeed" args={[rotationSpeeds, 3]} />
      </icosahedronGeometry>
      <meshStandardMaterial 
        color="#8B4513"
        roughness={0.9}
        metalness={0.1}
        onBeforeCompile={(shader) => {
          shader.uniforms.uTime = uniforms.uTime;
          shader.vertexShader = `
            uniform float uTime;
            attribute vec3 aRotationSpeed;

            // Function to create a rotation matrix
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
          ` + shader.vertexShader;

          shader.vertexShader = shader.vertexShader.replace(
            `#include <beginnormal_vertex>`,
            `
            // Apply rotation over time
            float rx = aRotationSpeed.x * uTime * 60.0;
            float ry = aRotationSpeed.y * uTime * 60.0;
            float rz = aRotationSpeed.z * uTime * 60.0;

            mat4 rotX = rotationMatrix(vec3(1.0, 0.0, 0.0), rx);
            mat4 rotY = rotationMatrix(vec3(0.0, 1.0, 0.0), ry);
            mat4 rotZ = rotationMatrix(vec3(0.0, 0.0, 1.0), rz);
            mat4 totalRot = rotZ * rotY * rotX;

            vec3 objectNormal = (totalRot * vec4(normal, 0.0)).xyz;
            `
          );

          shader.vertexShader = shader.vertexShader.replace(
            `#include <begin_vertex>`,
            `
            vec3 transformed = (totalRot * vec4(position, 1.0)).xyz;
            `
          );
        }}
      />
    </instancedMesh>
  );
}
