// AsteroidBelt.js - Performance-optimized asteroid belt with GPU acceleration
'use client';
import { useMemo, useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils, Vector3, Sphere } from 'three';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const tempObject = useMemo(() => new Object3D(), []);
  
  const innerRadius = 3.5;
  const outerRadius = 4.8;
  
  // Pre-compute all asteroid transforms and rotation deltas once
  const asteroidData = useMemo(() => {
    const positions = new Float32Array(asteroidCount * 3);
    const rotations = new Float32Array(asteroidCount * 3);
    const scales = new Float32Array(asteroidCount);
    const tumbles = new Float32Array(asteroidCount * 4); // axis.x, axis.y, axis.z, speed
    
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
      
      scales[i] = MathUtils.lerp(0.002, 0.008, Math.random());

      const i4 = i * 4;
      const axis = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      tumbles[i4] = axis.x;
      tumbles[i4+1] = axis.y;
      tumbles[i4+2] = axis.z;
      // Multiply speed by 3.0 to roughly match old visually
      tumbles[i4+3] = (Math.random() - 0.5) * 3.0;
    }
    
    return { positions, rotations, scales, tumbles };
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

    // Explicitly set a bounding sphere so frustum culling doesn't cull immediately
    meshRef.current.boundingSphere = new Sphere(new Vector3(0, 0, 0), outerRadius + 1.0);
  }, [asteroidCount, asteroidData, tempObject]);

  const groupRef = useRef();

  useFrame((state) => {
    // Slow group rotation for overall belt movement
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }

    // Update uniform for GPU tumbling
    if (materialRef.current && materialRef.current.userData.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const onBeforeCompile = useCallback((shader) => {
    shader.uniforms.uTime = { value: 0 };
    materialRef.current.userData.shader = shader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `
      #include <common>
      uniform float uTime;
      attribute vec4 aTumble;

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
      vec3 objectNormal = vec3( normal );
      mat4 rotN = rotationMatrix(aTumble.xyz, aTumble.w * uTime);
      objectNormal = (rotN * vec4(objectNormal, 0.0)).xyz;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      vec3 transformed = vec3( position );
      mat4 rot = rotationMatrix(aTumble.xyz, aTumble.w * uTime);
      transformed = (rot * vec4(transformed, 1.0)).xyz;
      `
    );
  }, []);

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[null, null, asteroidCount]} frustumCulled={true}>
        <icosahedronGeometry args={[1, 0]}>
          <instancedBufferAttribute
            attach="attributes-aTumble"
            args={[asteroidData.tumbles, 4]}
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
    </group>
  );
}
