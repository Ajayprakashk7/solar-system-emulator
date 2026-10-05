// AsteroidBelt.js - GPU Accelerated Asteroid Belt
'use client';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils, Sphere } from 'three';
import * as THREE from 'three';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  
  const innerRadius = 3.5;
  const outerRadius = 4.8;
  
  const asteroidData = useMemo(() => {
    const tempObject = new Object3D();
    const positions = new Float32Array(asteroidCount * 3);
    const matrices = new Float32Array(asteroidCount * 16);
    const randOffsets = new Float32Array(asteroidCount);
    
    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      
      const px = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      const py = (Math.random() - 0.5) * 0.3;
      const pz = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      
      positions[i*3] = px; positions[i*3+1] = py; positions[i*3+2] = pz;
      
      tempObject.position.set(px, py, pz);
      tempObject.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      tempObject.scale.setScalar(MathUtils.lerp(0.002, 0.008, Math.random()));
      tempObject.updateMatrix();
      tempObject.matrix.toArray(matrices, i * 16);
      
      randOffsets[i] = Math.random() * 100.0;
    }
    
    return { matrices, randOffsets };
  }, [asteroidCount]);

  useEffect(() => {
    if (!meshRef.current) return;
    const { matrices, randOffsets } = asteroidData;
    
    for (let i = 0; i < asteroidCount; i++) {
      meshRef.current.setMatrixAt(i, new THREE.Matrix4().fromArray(matrices, i * 16));
    }
    meshRef.current.geometry.setAttribute('aRandOffset', new THREE.InstancedBufferAttribute(randOffsets, 1));
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.boundingSphere = new Sphere(new THREE.Vector3(0,0,0), outerRadius + 1.0);
  }, [asteroidCount, asteroidData]);

  const groupRef = useRef();

  // Custom uniform ref to update time without forcing react re-renders
  const uniformsRef = useRef({
    uTime: { value: 0 }
  });

  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y += 0.001;
    uniformsRef.current.uTime.value = state.clock.elapsedTime;
  });

  const onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniformsRef.current.uTime;
    shader.vertexShader = `
      uniform float uTime;
      attribute float aRandOffset;
      varying vec3 vPosition;
      ${shader.vertexShader}
    `.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      
      // Fast, cheap GPU tumbling
      float time = aRandOffset + uTime * 0.5;
      float c = cos(time);
      float s = sin(time);
      mat3 rotZ = mat3(
        c, s, 0.0,
        -s, c, 0.0,
        0.0, 0.0, 1.0
      );
      mat3 rotY = mat3(
        c, 0.0, -s,
        0.0, 1.0, 0.0,
        s, 0.0, c
      );

      transformed = rotY * rotZ * transformed;
      `
    );
  };

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[null, null, asteroidCount]} frustumCulled={true}>
        <icosahedronGeometry args={[1, 0]} />
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
