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
  const { asteroids, rotationData, speedData } = useMemo(() => {
    const asteroids = [];
    const rotationData = new Float32Array(asteroidCount * 3);
    const speedData = new Float32Array(asteroidCount * 3);

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;
      
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      const y = heightVariation;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      const scale = MathUtils.lerp(0.002, 0.008, Math.random());

      asteroids.push({ x, y, z, scale });

      const i3 = i * 3;
      // Initial rotation
      rotationData[i3] = Math.random() * Math.PI;
      rotationData[i3 + 1] = Math.random() * Math.PI;
      rotationData[i3 + 2] = Math.random() * Math.PI;

      // Rotation speed
      speedData[i3] = (Math.random() - 0.5) * 0.02;
      speedData[i3 + 1] = (Math.random() - 0.5) * 0.02;
      speedData[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    return { asteroids, rotationData, speedData };
  }, [asteroidCount]);

  // Initial placement using useLayoutEffect to prevent flash of unpositioned content
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    
    asteroids.forEach((asteroid, i) => {
      // Set transform - Position and Scale only. Rotation is handled in shader.
      tempObject.position.set(asteroid.x, asteroid.y, asteroid.z);
      tempObject.rotation.set(0, 0, 0); // Identity rotation
      tempObject.scale.setScalar(asteroid.scale);
      tempObject.updateMatrix();
      
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroids, tempObject]);

  // Animation loop - minimal CPU work, just update time
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const onBeforeCompile = useMemo(() => (shader) => {
    shader.uniforms.uTime = { value: 0 };

    shader.vertexShader = `
      uniform float uTime;
      attribute vec3 aRotation;
      attribute vec3 aRotationSpeed;

      // Rotate a vector v by Euler angles r (XYZ order)
      vec3 rotate(vec3 v, vec3 r) {
        // Rotate X
        float cx = cos(r.x), sx = sin(r.x);
        v.yz = mat2(cx, -sx, sx, cx) * v.yz;

        // Rotate Y
        float cy = cos(r.y), sy = sin(r.y);
        v.xz = mat2(cy, -sy, sy, cy) * v.xz;

        // Rotate Z
        float cz = cos(r.z), sz = sin(r.z);
        v.xy = mat2(cz, -sz, sz, cz) * v.xy;

        return v;
      }
    ` + shader.vertexShader;

    // Inject rotation logic before the instance matrix application
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
        vec3 transformed = vec3( position );

        // Apply rotation: initial rotation + speed * time
        vec3 currentRotation = aRotation + aRotationSpeed * uTime;
        transformed = rotate(transformed, currentRotation);
      `
    );

    materialRef.current = shader;
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
        <instancedBufferAttribute
          attach="attributes-aRotation"
          args={[rotationData, 3]}
        />
        <instancedBufferAttribute
          attach="attributes-aRotationSpeed"
          args={[speedData, 3]}
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
