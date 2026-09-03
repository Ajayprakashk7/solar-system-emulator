import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils } from 'three';
import { useSpeedControl } from '../contexts/SpeedControlContext';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  const groupRef = useRef();
  const tempObject = useMemo(() => new Object3D(), []);
  const { speedFactor } = useSpeedControl();
  const simulatedTimeRef = useRef(0);
  
  const innerRadius = 3.5;
  const outerRadius = 4.8;
  
  // Pre-compute all asteroid transforms and rotation deltas once
  const asteroidData = useMemo(() => {
    const positions = new Float32Array(asteroidCount * 3);
    const rotations = new Float32Array(asteroidCount * 3);
    const rotationSpeeds = new Float32Array(asteroidCount * 3);
    const scales = new Float32Array(asteroidCount);
    
    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      
      const i3 = i * 3;
      positions[i3]     = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      positions[i3 + 1] = (Math.random() - 0.5) * 0.3;
      positions[i3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      
      rotations[i3]     = Math.random() * Math.PI;
      rotations[i3 + 1] = Math.random() * Math.PI;
      rotations[i3 + 2] = Math.random() * Math.PI;
      
      rotationSpeeds[i3]     = (Math.random() - 0.5) * 0.02;
      rotationSpeeds[i3 + 1] = (Math.random() - 0.5) * 0.02;
      rotationSpeeds[i3 + 2] = (Math.random() - 0.5) * 0.02;
      
      scales[i] = MathUtils.lerp(0.002, 0.008, Math.random());
    }
    
    return { positions, rotations, rotationSpeeds, scales };
  }, [asteroidCount]);

  // Set initial instance matrices once on mount instead of every frame
  useEffect(() => {
    if (!meshRef.current) return;
    const { positions, rotations, scales } = asteroidData;
    
    for (let i = 0; i < asteroidCount; i++) {
      const i3 = i * 3;
      tempObject.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      tempObject.rotation.set(rotations[i3], rotations[i3 + 1], rotations[i3 + 2]);
      tempObject.scale.setScalar(scales[i]);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroidCount, asteroidData, tempObject]);

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((state, delta) => {
    // Integrate speed factor into simulated time
    simulatedTimeRef.current += delta * speedFactor;

    // Slow group rotation for overall belt movement (~0.06 deg/frame at 1x speed)
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001 * speedFactor;
    }
    
    uniforms.uTime.value = simulatedTimeRef.current;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[null, null, asteroidCount]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]}>
          <instancedBufferAttribute
            attach="attributes-aRotationSpeed"
            args={[asteroidData.rotationSpeeds, 3]}
          />
        </icosahedronGeometry>
        <meshStandardMaterial 
          color="#8B4513"
          roughness={0.9}
          metalness={0.1}
          onBeforeCompile={(shader) => {
            shader.uniforms.uTime = uniforms.uTime;

            shader.vertexShader = `
              attribute vec3 aRotationSpeed;
              uniform float uTime;

              mat3 getRotationMatrix(vec3 euler) {
                float cX = cos(euler.x);
                float sX = sin(euler.x);
                float cY = cos(euler.y);
                float sY = sin(euler.y);
                float cZ = cos(euler.z);
                float sZ = sin(euler.z);

                mat3 rotX = mat3(
                    1.0, 0.0, 0.0,
                    0.0, cX, sX,
                    0.0, -sX, cX
                );

                mat3 rotY = mat3(
                    cY, 0.0, -sY,
                    0.0, 1.0, 0.0,
                    sY, 0.0, cY
                );

                mat3 rotZ = mat3(
                    cZ, sZ, 0.0,
                    -sZ, cZ, 0.0,
                    0.0, 0.0, 1.0
                );

                return rotZ * rotY * rotX;
              }
            ` + shader.vertexShader;

            shader.vertexShader = shader.vertexShader.replace(
              '#include <beginnormal_vertex>',
              `
              #include <beginnormal_vertex>
              mat3 localRot = getRotationMatrix(aRotationSpeed * uTime * 60.0);
              objectNormal = localRot * objectNormal;
              `
            );

            shader.vertexShader = shader.vertexShader.replace(
              '#include <begin_vertex>',
              `
              #include <begin_vertex>
              transformed = localRot * transformed;
              `
            );
          }}
        />
      </instancedMesh>
    </group>
  );
}
