// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils } from 'three';
import { nasaAPI } from '../services/nasaAPI';
import { nasaLogger } from '../../../lib/logger';

const AsteroidBeltComponent = ({ asteroidCount = 500 }) => {
  const meshRef = useRef();
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
  const { positions, rotationSpeeds } = useMemo(() => {
    const tempObject = new Object3D();
    const positionsArray = new Float32Array(asteroidCount * 16);
    const rotationSpeedsArray = new Float32Array(asteroidCount * 3);

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

      rotationSpeedsArray[i * 3] = (Math.random() - 0.5) * 0.02;
      rotationSpeedsArray[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      rotationSpeedsArray[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      tempObject.position.set(x, y, z);
      tempObject.rotation.set(rotationX, rotationY, rotationZ);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();

      tempObject.matrix.toArray(positionsArray, i * 16);
    }

    return { positions: positionsArray, rotationSpeeds: rotationSpeedsArray };
  }, [asteroidCount]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.instanceMatrix.array.set(positions);
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [positions]);

  const onBeforeCompile = useCallback((shader) => {
    shader.uniforms.time = { value: 0 };
    if (meshRef.current) {
      meshRef.current.userData.shader = shader;
    }

    shader.vertexShader = `
      uniform float time;
      attribute vec3 aRotationSpeed;
      
      // Function to create quaternion from euler angles
      vec4 quaternionFromEuler( vec3 euler ) {
        float c1 = cos( euler.x / 2.0 );
        float c2 = cos( euler.y / 2.0 );
        float c3 = cos( euler.z / 2.0 );
        float s1 = sin( euler.x / 2.0 );
        float s2 = sin( euler.y / 2.0 );
        float s3 = sin( euler.z / 2.0 );

        return vec4(
          s1 * c2 * c3 + c1 * s2 * s3,
          c1 * s2 * c3 - s1 * c2 * s3,
          c1 * c2 * s3 + s1 * s2 * c3,
          c1 * c2 * c3 - s1 * s2 * s3
        );
      }
      
      vec3 rotateVectorByQuaternion( vec3 v, vec4 q ) {
        return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
      }

      ${shader.vertexShader}
    `;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `
      vec3 rotationAngles = aRotationSpeed * time;
      vec4 qRotation = quaternionFromEuler(rotationAngles);
      vec3 objectNormal = rotateVectorByQuaternion(normal, qRotation);
      `
    );
    
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      vec3 transformed = rotateVectorByQuaternion(position, qRotation);
      `
    );
  }, []);

  useFrame((state) => {
    if (meshRef.current?.userData?.shader) {
      meshRef.current.userData.shader.uniforms.time.value = state.clock.getElapsedTime() * 60.0;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, asteroidCount]} frustumCulled={true}>
      <icosahedronGeometry args={[1, 0]}>
        <instancedBufferAttribute
          attach="attributes-aRotationSpeed"
          args={[rotationSpeeds, 3]}
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
};

const AsteroidBelt = React.memo(AsteroidBeltComponent);
export default AsteroidBelt;
