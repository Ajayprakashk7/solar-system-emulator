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
  const { initialData, speeds } = useMemo(() => {
    const data = [];
    const speedArray = new Float32Array(asteroidCount * 3);

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

      // Speed (X, Y, Z)
      speedArray[i * 3] = (Math.random() - 0.5) * 0.02;
      speedArray[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      speedArray[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    return { initialData: data, speeds: speedArray };
  }, [asteroidCount]);

  // Set initial positions once
  useLayoutEffect(() => {
    if (!meshRef.current) return;

    initialData.forEach((asteroid, i) => {
      tempObject.position.set(asteroid.x, asteroid.y, asteroid.z);
      tempObject.rotation.set(asteroid.rotationX, asteroid.rotationY, asteroid.rotationZ);
      tempObject.scale.setScalar(asteroid.scale);
      tempObject.updateMatrix();
      
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [initialData, tempObject]);

  // Animation via shader
  useFrame((state) => {
    if (materialRef.current && materialRef.current.userData.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const onBeforeCompile = useCallback((shader) => {
    shader.uniforms.uTime = { value: 0 };
    materialRef.current.userData.shader = shader;

    shader.vertexShader = `
      uniform float uTime;
      attribute vec3 aRotationSpeed;

      vec3 rotate(vec3 v, vec3 angles) {
        // Rotate X
        float cx = cos(angles.x); float sx = sin(angles.x);
        vec3 temp = v;
        v.y = temp.y * cx - temp.z * sx;
        v.z = temp.y * sx + temp.z * cx;

        // Rotate Y
        float cy = cos(angles.y); float sy = sin(angles.y);
        temp = v;
        v.x = temp.x * cy + temp.z * sy;
        v.z = -temp.x * sy + temp.z * cy;

        // Rotate Z
        float cz = cos(angles.z); float sz = sin(angles.z);
        temp = v;
        v.x = temp.x * cz - temp.y * sz;
        v.y = temp.x * sz + temp.y * cz;

        return v;
      }
    ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vec3 rotationAngles = aRotationSpeed * uTime * 60.0;
      transformed = rotate(transformed, rotationAngles);
      `
    );
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
        <instancedBufferAttribute
          attach="attributes-aRotationSpeed"
          args={[speeds, 3]}
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
