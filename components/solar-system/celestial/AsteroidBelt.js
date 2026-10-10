// AsteroidBelt.js - Performance-optimized asteroid belt
'use client';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils, Sphere, InstancedBufferAttribute } from 'three';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  const tempObject = useMemo(() => new Object3D(), []);
  const uniformsRef = useRef({ uTime: { value: 0 } });
  
  const innerRadius = 3.5;
  const outerRadius = 4.8;
  
  // Pre-compute all asteroid transforms and rotation speeds once
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
      
      rotationSpeeds[i3]     = (Math.random() - 0.5) * 1.5;
      rotationSpeeds[i3 + 1] = (Math.random() - 0.5) * 1.5;
      rotationSpeeds[i3 + 2] = (Math.random() - 0.5) * 1.5;
      
      scales[i] = MathUtils.lerp(0.002, 0.008, Math.random());
    }
    
    return { positions, rotations, rotationSpeeds, scales };
  }, [asteroidCount]);

  // Set initial instance matrices once on mount
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

    // Set a bounding sphere covering the whole asteroid belt for proper frustum culling
    meshRef.current.boundingSphere = new Sphere(undefined, outerRadius + 1.0);
  }, [asteroidCount, asteroidData, tempObject]);

  // Custom shader for GPU-accelerated asteroid tumbling
  const onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniformsRef.current.uTime;

    shader.vertexShader = `
      attribute vec3 rotationSpeed;
      uniform float uTime;

      // Function to generate a rotation matrix
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

      ${shader.vertexShader}
    `;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `
      // Compute animated rotation based on per-instance rotation speed
      mat4 rotX = rotationMatrix(vec3(1.0, 0.0, 0.0), rotationSpeed.x * uTime);
      mat4 rotY = rotationMatrix(vec3(0.0, 1.0, 0.0), rotationSpeed.y * uTime);
      mat4 rotZ = rotationMatrix(vec3(0.0, 0.0, 1.0), rotationSpeed.z * uTime);

      mat4 animatedRotation = rotZ * rotY * rotX;

      // Extract position from instanceMatrix
      vec3 instPosition = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);

      // Extract scale (assuming uniform scale for simplicity)
      float instScale = length(vec3(instanceMatrix[0][0], instanceMatrix[0][1], instanceMatrix[0][2]));

      // Apply rotation to the local vertex, then scale, then translate to instance position
      vec4 localPos = animatedRotation * vec4(transformed, 1.0);
      vec3 finalPos = (localPos.xyz * instScale) + instPosition;

      vec4 mvPosition = vec4( finalPos, 1.0 );

      #ifdef USE_INSTANCING

        mvPosition = modelViewMatrix * mvPosition;

      #else

        mvPosition = modelViewMatrix * mvPosition;

      #endif

      gl_Position = projectionMatrix * mvPosition;
      `
    );
  };

  const groupRef = useRef();

  useFrame((state, delta) => {
    // Slow group rotation for overall belt movement
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
    
    // Update time uniform for GPU tumbling
    uniformsRef.current.uTime.value += delta;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[null, null, asteroidCount]} frustumCulled={true}>
        <icosahedronGeometry args={[1, 0]}>
          <instancedBufferAttribute attach="attributes-rotationSpeed" args={[asteroidData.rotationSpeeds, 3]} />
        </icosahedronGeometry>
        <meshStandardMaterial 
          color="#8B4513"
          roughness={0.9}
          metalness={0.1}
          onBeforeCompile={onBeforeCompile}
        />
      </instancedMesh>
    </group>
  );
}
