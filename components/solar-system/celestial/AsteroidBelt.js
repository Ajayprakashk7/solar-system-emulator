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
  const { matrixData, rotationSpeeds } = useMemo(() => {
    const tempObject = new Object3D();
    // Float32Array for matrix data (16 floats per instance)
    const matrices = new Float32Array(asteroidCount * 16);
    // Float32Array for rotation speeds (3 floats per instance)
    const speeds = new Float32Array(asteroidCount * 3);

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

      // Set initial transform (Position + Initial Rotation + Scale)
      tempObject.position.set(x, y, z);
      tempObject.rotation.set(rotationX, rotationY, rotationZ);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();

      tempObject.matrix.toArray(matrices, i * 16);

      // Rotation speeds for shader animation
      speeds[i * 3] = (Math.random() - 0.5) * 0.02;     // Speed X
      speeds[i * 3 + 1] = (Math.random() - 0.5) * 0.02; // Speed Y
      speeds[i * 3 + 2] = (Math.random() - 0.5) * 0.02; // Speed Z
    }

    return { matrixData: matrices, rotationSpeeds: speeds };
  }, [asteroidCount]);

  // Update instance matrices once when data changes
  useLayoutEffect(() => {
    if (meshRef.current) {
      meshRef.current.instanceMatrix.array.set(matrixData);
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [matrixData]);

  // Inject shader code to handle rotation on GPU
  const onBeforeCompile = useCallback((shader) => {
    shader.uniforms.uTime = { value: 0 };

    shader.vertexShader = `
      attribute vec3 aRotationSpeed;
      uniform float uTime;
      ${shader.vertexShader}
    `;
    
    // Inject rotation logic before position transformation
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      
      // GPU Animation: Rotate vertices based on time and instance speed
      // This rotates the asteroid "in place" around its local center
      float t = uTime;
      vec3 angles = aRotationSpeed * t;
      
      float cx = cos(angles.x);
      float sx = sin(angles.x);
      float cy = cos(angles.y);
      float sy = sin(angles.y);
      float cz = cos(angles.z);
      float sz = sin(angles.z);

      // Rotate around X
      mat3 rx = mat3(1.0, 0.0, 0.0,
                     0.0, cx, -sx,
                     0.0, sx, cx);

      // Rotate around Y
      mat3 ry = mat3(cy, 0.0, sy,
                     0.0, 1.0, 0.0,
                     -sy, 0.0, cy);

      // Rotate around Z
      mat3 rz = mat3(cz, -sz, 0.0,
                     sz, cz, 0.0,
                     0.0, 0.0, 1.0);

      // Combined rotation order: Z * Y * X
      mat3 rot = rz * ry * rx;

      transformed = rot * transformed;
      `
    );

    // Rotate normals to ensure correct lighting on rotating objects
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `
      #include <beginnormal_vertex>
      objectNormal = rot * objectNormal;
      `
    );
    
    // Save reference to shader to update uniforms
    materialRef.current.userData.shader = shader;
  }, []);

  useFrame((state) => {
    if (materialRef.current?.userData?.shader) {
      // Scale time to match original speed (originally tuned for ~60FPS loop)
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime() * 60.0;
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
