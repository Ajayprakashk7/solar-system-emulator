// AsteroidBelt.js - Performance-optimized asteroid belt
'use client';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils } from 'three';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const tempObject = useMemo(() => new Object3D(), []);
  
  const innerRadius = 3.5;
  const outerRadius = 4.8;
  
  // Pre-compute all asteroid transforms and rotation variables once
  const asteroidData = useMemo(() => {
    const positions = new Float32Array(asteroidCount * 3);
    const rotations = new Float32Array(asteroidCount * 3);
    const rotationAxes = new Float32Array(asteroidCount * 3);
    const rotationSpeeds = new Float32Array(asteroidCount);
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
      
      // Generate a random normalized axis of rotation
      const ax = Math.random() - 0.5;
      const ay = Math.random() - 0.5;
      const az = Math.random() - 0.5;
      const len = Math.sqrt(ax * ax + ay * ay + az * az);

      rotationAxes[i3]     = ax / len;
      rotationAxes[i3 + 1] = ay / len;
      rotationAxes[i3 + 2] = az / len;

      // Random rotation speed
      rotationSpeeds[i] = (Math.random() - 0.5) * 2.0;
      
      scales[i] = MathUtils.lerp(0.002, 0.008, Math.random());
    }
    
    return { positions, rotations, rotationAxes, rotationSpeeds, scales };
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

  // Group rotation uses the CPU, but individual tumbling is handled strictly by the GPU
  const groupRef = useRef();

  useFrame((state) => {
    // Slow group rotation for overall belt movement
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
    
    // Pass time to the material's shader for GPU tumbling
    if (materialRef.current && materialRef.current.userData.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    materialRef.current.userData.shader = shader;

    // Add attributes and uniforms
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
    ` + shader.vertexShader;

    // Inject before normal computation to explicitly rotate the vertex normals
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `
      float angle = uTime * aRotationSpeed;
      mat4 rotMat = rotationMatrix(aRotationAxis, angle);

      // Rotate normals for correct lighting
      vec3 objectNormal = (rotMat * vec4(normal, 0.0)).xyz;
      `
    );

    // Inject before position computation to rotate the mesh vertices
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      // Rotate positions
      vec3 transformed = (rotMat * vec4(position, 1.0)).xyz;
      `
    );
  };

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
          onBeforeCompile={onBeforeCompile}
        />
      </instancedMesh>
    </group>
  );
}
