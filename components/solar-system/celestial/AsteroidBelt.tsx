// AsteroidBelt.tsx - Realistic asteroid belt between Mars and Jupiter
'use client';
import { useMemo, useRef, useEffect, useState, useLayoutEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils, InstancedMesh, BufferGeometry, Material } from 'three';
import { nasaAPI } from '../services/nasaAPI';
import { nasaLogger } from '../../../lib/logger';

interface AsteroidBeltProps {
  asteroidCount?: number;
}

export default function AsteroidBelt({ asteroidCount = 500 }: AsteroidBeltProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const tempObject = useMemo(() => new Object3D(), []);
  const [neoData, setNeoData] = useState<{ element_count: number } | null>(null);
  const materialUserData = useRef({ uTime: { value: 0 } });

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

  // GPU implementation: generate static attributes for GPU rotation
  const { rotationSpeeds, initialRotations } = useMemo(() => {
    const rotationSpeeds = new Float32Array(asteroidCount * 3);
    const initialRotations = new Float32Array(asteroidCount * 3);

    for (let i = 0; i < asteroidCount; i++) {
      const i3 = i * 3;
      initialRotations[i3] = Math.random() * Math.PI;
      initialRotations[i3 + 1] = Math.random() * Math.PI;
      initialRotations[i3 + 2] = Math.random() * Math.PI;

      // Store per-frame equivalent speeds scaled up to reasonable continuous rotation
      rotationSpeeds[i3] = (Math.random() - 0.5) * 1.2;
      rotationSpeeds[i3 + 1] = (Math.random() - 0.5) * 1.2;
      rotationSpeeds[i3 + 2] = (Math.random() - 0.5) * 1.2;
    }

    return { rotationSpeeds, initialRotations };
  }, [asteroidCount]);

  useLayoutEffect(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const heightVariation = (Math.random() - 0.5) * 0.3;

      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      const y = heightVariation;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      const scale = MathUtils.lerp(0.002, 0.008, Math.random());

      tempObject.position.set(x, y, z);
      tempObject.rotation.set(0, 0, 0); // Rotation handled entirely in GPU
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();

      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroidCount, innerRadius, outerRadius, tempObject]);

  const onBeforeCompile = useCallback((shader: import('three').WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uTime = materialUserData.current.uTime;

    shader.vertexShader = `
      attribute vec3 aInitialRotation;
      attribute vec3 aRotationSpeed;
      uniform float uTime;

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

      mat4 getEulerRotationMatrix(vec3 euler) {
        mat4 rx = rotationMatrix(vec3(1.0, 0.0, 0.0), euler.x);
        mat4 ry = rotationMatrix(vec3(0.0, 1.0, 0.0), euler.y);
        mat4 rz = rotationMatrix(vec3(0.0, 0.0, 1.0), euler.z);
        return rz * ry * rx;
      }

      ${shader.vertexShader}
    `;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      vec3 currentRotation = aInitialRotation + aRotationSpeed * uTime;
      mat4 rotMat = getEulerRotationMatrix(currentRotation);
      vec3 transformed = (rotMat * vec4(position, 1.0)).xyz;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `
      vec3 currentRotationNormal = aInitialRotation + aRotationSpeed * uTime;
      mat4 rotMatNormal = getEulerRotationMatrix(currentRotationNormal);
      vec3 objectNormal = (rotMatNormal * vec4(normal, 0.0)).xyz;
      `
    );
  }, []);

  useFrame((state) => {
    materialUserData.current.uTime.value = state.clock.getElapsedTime();
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined as unknown as BufferGeometry, undefined as unknown as Material | Material[], asteroidCount]}>
      <icosahedronGeometry args={[1, 0]}>
        <instancedBufferAttribute attach="attributes-aInitialRotation" args={[initialRotations, 3]} />
        <instancedBufferAttribute attach="attributes-aRotationSpeed" args={[rotationSpeeds, 3]} />
      </icosahedronGeometry>
      <meshStandardMaterial
        color="#8B4513"
        roughness={0.9}
        metalness={0.1}
        onBeforeCompile={onBeforeCompile}
        customProgramCacheKey={() => 'AsteroidBeltMaterial'}
      />
    </instancedMesh>
  );
}
