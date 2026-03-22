// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils } from 'three';
import { nasaAPI } from '../services/nasaAPI';
import { nasaLogger } from '../../../lib/logger';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  const [neoData, setNeoData] = useState(null);
  
  // Custom material uniforms reference
  const materialRef = useRef();
  const materialUserData = useRef({ shader: null }).current;

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
  
  // Generate asteroid positions and rotation speeds
  const { matrices, rotationSpeeds } = useMemo(() => {
    const matrices = new Float32Array(asteroidCount * 16);
    const rotationSpeeds = new Float32Array(asteroidCount * 3);
    const tempObject = new Object3D();

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

      tempObject.matrix.toArray(matrices, i * 16);

      rotationSpeeds[i * 3] = (Math.random() - 0.5) * 2.0; // speed X
      rotationSpeeds[i * 3 + 1] = (Math.random() - 0.5) * 2.0; // speed Y
      rotationSpeeds[i * 3 + 2] = (Math.random() - 0.5) * 2.0; // speed Z
    }

    return { matrices, rotationSpeeds };
  }, [asteroidCount]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.instanceMatrix.array.set(matrices);
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [matrices]);

  useFrame((state) => {
    if (materialUserData.shader) {
      materialUserData.shader.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const onBeforeCompile = useCallback((shader) => {
    shader.uniforms.uTime = { value: 0 };
    
    shader.vertexShader = `
      uniform float uTime;
      attribute vec3 aRotationSpeed;
      
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
    `;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `
      #include <beginnormal_vertex>

      // Add individual rotations based on speed and time
      mat4 rotX = rotationMatrix(vec3(1.0, 0.0, 0.0), aRotationSpeed.x * uTime);
      mat4 rotY = rotationMatrix(vec3(0.0, 1.0, 0.0), aRotationSpeed.y * uTime);
      mat4 rotZ = rotationMatrix(vec3(0.0, 0.0, 1.0), aRotationSpeed.z * uTime);
      mat4 rot = rotZ * rotY * rotX;

      objectNormal = (rot * vec4(objectNormal, 0.0)).xyz;
      `
    );
    
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>

      transformed = (rot * vec4(transformed, 1.0)).xyz;
      `
    );

    materialUserData.shader = shader;
  }, [materialUserData]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, asteroidCount]}>
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
        userData={materialUserData}
      />
    </instancedMesh>
  );
}
