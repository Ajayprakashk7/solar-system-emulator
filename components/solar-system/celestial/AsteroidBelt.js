// AsteroidBelt.js - Performance-optimized asteroid belt
'use client';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils, Vector3 } from 'three';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  const materialRef = useRef();
  
  const innerRadius = 3.5;
  const outerRadius = 4.8;
  
  // Pre-compute all asteroid transforms and rotation variables once
  const asteroidData = useMemo(() => {
    const tempObject = new Object3D();
    const matrices = new Float32Array(asteroidCount * 16);
    const rotationAxes = new Float32Array(asteroidCount * 3);
    const rotationSpeeds = new Float32Array(asteroidCount);
    
    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      const y = (Math.random() - 0.5) * 0.3;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      
      const scale = MathUtils.lerp(0.002, 0.008, Math.random());
      
      tempObject.position.set(x, y, z);
      // Random initial rotation
      tempObject.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();

      tempObject.matrix.toArray(matrices, i * 16);

      // Random rotation axis
      const axis = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      rotationAxes[i * 3] = axis.x;
      rotationAxes[i * 3 + 1] = axis.y;
      rotationAxes[i * 3 + 2] = axis.z;
      
      // Random rotation speed
      rotationSpeeds[i] = (Math.random() - 0.5) * 2.0; // rad per sec
    }
    
    return { matrices, rotationAxes, rotationSpeeds };
  }, [asteroidCount]);

  // Set initial instance matrices once on mount
  useEffect(() => {
    if (!meshRef.current) return;
    
    meshRef.current.instanceMatrix.array.set(asteroidData.matrices);
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroidData]);

  const groupRef = useRef();

  useFrame((state) => {
    // Slow group rotation for overall belt movement (~0.06 deg/frame)
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }

    // Pass elapsed time to the material shader
    if (materialRef.current && materialRef.current.userData.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[null, null, asteroidCount]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]}>
          <instancedBufferAttribute attach="attributes-aRotationAxis" args={[asteroidData.rotationAxes, 3]} />
          <instancedBufferAttribute attach="attributes-aRotationSpeed" args={[asteroidData.rotationSpeeds, 1]} />
        </icosahedronGeometry>
        <meshStandardMaterial 
          ref={materialRef}
          color="#8B4513"
          roughness={0.9}
          metalness={0.1}
          onBeforeCompile={(shader) => {
            shader.uniforms.uTime = { value: 0 };

            shader.vertexShader = shader.vertexShader.replace(
              '#include <common>',
              `
              #include <common>
              uniform float uTime;
              attribute vec3 aRotationAxis;
              attribute float aRotationSpeed;

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
              `
            );

            shader.vertexShader = shader.vertexShader.replace(
              '#include <beginnormal_vertex>',
              `
              #include <beginnormal_vertex>
              float angle = aRotationSpeed * uTime;
              mat4 rot = rotationMatrix(aRotationAxis, angle);
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

            materialRef.current.userData.shader = shader;
          }}
        />
      </instancedMesh>
    </group>
  );
}
