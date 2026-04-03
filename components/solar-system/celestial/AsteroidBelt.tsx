// AsteroidBelt.tsx - Realistic asteroid belt between Mars and Jupiter optimized with GPU instancing
'use client';
import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils, InstancedMesh, MeshStandardMaterial } from 'three';
import { nasaAPI } from '../services/nasaAPI';
import { nasaLogger } from '../../../lib/logger';

interface AsteroidBeltProps {
  asteroidCount?: number;
}

export default function AsteroidBelt({ asteroidCount = 500 }: AsteroidBeltProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const materialRef = useRef<MeshStandardMaterial>(null);

  const [neoData, setNeoData] = useState<unknown>(null);

  // Asteroid belt parameters (between Mars ~1.5 AU and Jupiter ~5.2 AU)
  const innerRadius = 3.5;
  const outerRadius = 4.8;

  // Optionally fetch real Near-Earth Object data from NASA
  useEffect(() => {
    nasaAPI.getNearEarthObjects(null, null).then((data: unknown) => {
      const neo = data as { element_count?: number };
      if (neo?.element_count && neo.element_count > 0) {
        nasaLogger.debug(`Loaded ${neo.element_count} near-Earth objects`);
        setNeoData(neo);
        // Future enhancement: Use neoData to position asteroids based on real orbital data
        nasaLogger.debug('Integration ready for enhanced asteroid positioning');
      }
    }).catch((error: Error) => {
      nasaLogger.warn('Failed to fetch NEO data, using procedural generation:', error);
    });
  }, []);

  // Log NEO data status for debugging
  useEffect(() => {
    if (neoData) {
      nasaLogger.debug('Data available:', (neoData as { element_count?: number }).element_count, 'objects');
    }
  }, [neoData]);

  // Pre-calculate matrices and attributes once for GPU offloading
  const { matrixArray, rotationAxes, rotationSpeeds } = useMemo(() => {
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
      const scale = MathUtils.lerp(0.002, 0.008, Math.random());

      const rotationX = Math.random() * Math.PI;
      const rotationY = Math.random() * Math.PI;
      const rotationZ = Math.random() * Math.PI;

      tempObject.position.set(x, y, z);
      tempObject.rotation.set(rotationX, rotationY, rotationZ);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();

      tempObject.matrix.toArray(matrices, i * 16);

      // Random rotation axis
      const ax = Math.random() - 0.5;
      const ay = Math.random() - 0.5;
      const az = Math.random() - 0.5;
      const len = Math.sqrt(ax*ax + ay*ay + az*az);
      axes[i * 3] = ax / len;
      axes[i * 3 + 1] = ay / len;
      axes[i * 3 + 2] = az / len;

      // Rotation speed
      speeds[i] = (Math.random() - 0.5) * 2.0;
    }

    return { matrixArray: matrices, rotationAxes: axes, rotationSpeeds: speeds };
  }, [asteroidCount]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.instanceMatrix.array.set(matrixArray);
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [matrixArray]);

  const onBeforeCompile = useCallback((shader: { uniforms: Record<string, { value: unknown }>; vertexShader: string }) => {
    shader.uniforms.uTime = { value: 0 };

    if (materialRef.current) {
      materialRef.current.userData.shader = shader;
    }

    shader.vertexShader = `
      attribute vec3 aRotationAxis;
      attribute float aRotationSpeed;
      uniform float uTime;

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
      '#include <beginnormal_vertex>',
      `
      float angle = uTime * aRotationSpeed;
      mat4 rot = rotationMatrix(aRotationAxis, angle);
      vec3 objectNormal = (rot * vec4(normal, 0.0)).xyz;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      vec3 transformed = (rot * vec4(position, 1.0)).xyz;
      `
    );
  }, []);

  useFrame((state) => {
    if (materialRef.current && materialRef.current.userData.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
        <instancedBufferAttribute attach="attributes-aRotationAxis" args={[rotationAxes, 3]} />
        <instancedBufferAttribute attach="attributes-aRotationSpeed" args={[rotationSpeeds, 1]} />
      </icosahedronGeometry>
      <meshStandardMaterial
        ref={materialRef}
        color="#8B4513"
        roughness={0.9}
        metalness={0.1}
        onBeforeCompile={onBeforeCompile}
        customProgramCacheKey={() => 'AsteroidBeltMaterial'}
      />
    </instancedMesh>
  );
}
