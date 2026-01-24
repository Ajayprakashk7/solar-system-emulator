// AsteroidBelt.js - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect, useState, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils } from 'three';
import { nasaAPI } from '../services/nasaAPI';
import { nasaLogger } from '../../../lib/logger';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  const shaderRef = useRef();
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
  
  // Generate asteroid data
  const { asteroids, speeds } = useMemo(() => {
    const asteroidsData = [];
    const speedsData = new Float32Array(asteroidCount * 3);

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      asteroidsData.push({
        x: Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5,
        y: heightVariation,
        z: Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5,
        scale: MathUtils.lerp(0.002, 0.008, Math.random()),
        rotationX: Math.random() * Math.PI,
        rotationY: Math.random() * Math.PI,
        rotationZ: Math.random() * Math.PI,
      });

      // Pre-multiply by 60 to match original 60FPS frame-based speed
      speedsData[i * 3] = (Math.random() - 0.5) * 0.02 * 60.0;
      speedsData[i * 3 + 1] = (Math.random() - 0.5) * 0.02 * 60.0;
      speedsData[i * 3 + 2] = (Math.random() - 0.5) * 0.02 * 60.0;
    }
    return { asteroids: asteroidsData, speeds: speedsData };
  }, [asteroidCount]);

  // Set initial instance matrices
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    
    asteroids.forEach((asteroid, i) => {
      tempObject.position.set(asteroid.x, asteroid.y, asteroid.z);
      tempObject.rotation.set(asteroid.rotationX, asteroid.rotationY, asteroid.rotationZ);
      tempObject.scale.setScalar(asteroid.scale);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroids, tempObject]);

  // Animation via Vertex Shader
  const onBeforeCompile = useMemo(() => (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shaderRef.current = shader;

    shader.vertexShader = `
      attribute vec3 aRotationSpeed;
      uniform float uTime;

      // Rotate around X, Y, Z axes
      vec3 rotate(vec3 v, vec3 angles) {
        // Rotate X
        float cx = cos(angles.x);
        float sx = sin(angles.x);
        v.yz = mat2(cx, -sx, sx, cx) * v.yz;

        // Rotate Y
        float cy = cos(angles.y);
        float sy = sin(angles.y);
        v.xz = mat2(cy, -sy, sy, cy) * v.xz;

        // Rotate Z
        float cz = cos(angles.z);
        float sz = sin(angles.z);
        v.xy = mat2(cz, -sz, sz, cz) * v.xy;

        return v;
      }
    ` + shader.vertexShader;

    // Rotate normals to ensure correct lighting
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_normal>',
      `
      #include <begin_normal>
      vec3 rotationAnglesNormal = aRotationSpeed * uTime;
      objectNormal = rotate(objectNormal, rotationAnglesNormal);
      `
    );

    // Rotate vertices
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>

      // Apply rotation based on time and speed
      vec3 rotationAngles = aRotationSpeed * uTime;
      transformed = rotate(transformed, rotationAngles);
      `
    );
  }, []);

  useFrame(({ clock }) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
        <instancedBufferAttribute attach="attributes-aRotationSpeed" args={[speeds, 3]} />
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
