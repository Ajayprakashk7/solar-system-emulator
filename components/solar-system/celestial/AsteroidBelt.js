// AsteroidBelt.js - Performance-optimized asteroid belt
'use client';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils, InstancedBufferAttribute } from 'three';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const tempObject = useMemo(() => new Object3D(), []);
  
  const innerRadius = 3.5;
  const outerRadius = 4.8;
  
  const asteroidData = useMemo(() => {
    const positions = new Float32Array(asteroidCount * 3);
    const scales = new Float32Array(asteroidCount);
    const initialRotations = new Float32Array(asteroidCount * 3);
    const rotationSpeeds = new Float32Array(asteroidCount * 3);
    
    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = MathUtils.lerp(innerRadius, outerRadius, Math.random());
      
      const i3 = i * 3;
      positions[i3]     = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      positions[i3 + 1] = (Math.random() - 0.5) * 0.3;
      positions[i3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      
      scales[i] = MathUtils.lerp(0.002, 0.008, Math.random());
      
      initialRotations[i3]     = Math.random() * Math.PI;
      initialRotations[i3 + 1] = Math.random() * Math.PI;
      initialRotations[i3 + 2] = Math.random() * Math.PI;
      
      // Speed multiplier for shader per-second (was ~0.02 per frame * 3 frames = ~0.06 per update, ~60fps)
      // Original: 0.02 per frame = 1.2 rad/sec. Let's just use roughly 1.2.
      rotationSpeeds[i3]     = (Math.random() - 0.5) * 1.2;
      rotationSpeeds[i3 + 1] = (Math.random() - 0.5) * 1.2;
      rotationSpeeds[i3 + 2] = (Math.random() - 0.5) * 1.2;
    }
    
    return { positions, scales, initialRotations, rotationSpeeds };
  }, [asteroidCount]);

  useEffect(() => {
    if (!meshRef.current) return;
    const { positions, scales, initialRotations, rotationSpeeds } = asteroidData;
    
    for (let i = 0; i < asteroidCount; i++) {
      const i3 = i * 3;
      tempObject.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      tempObject.scale.setScalar(scales[i]);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    meshRef.current.geometry.setAttribute('aInitialRotation', new InstancedBufferAttribute(initialRotations, 3));
    meshRef.current.geometry.setAttribute('aRotationSpeed', new InstancedBufferAttribute(rotationSpeeds, 3));
  }, [asteroidCount, asteroidData, tempObject]);

  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y += 0.001;
    if (materialRef.current?.userData?.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    materialRef.current.userData.shader = shader;
    
    shader.vertexShader = `
      uniform float uTime;
      attribute vec3 aInitialRotation;
      attribute vec3 aRotationSpeed;
      
      mat4 rotationMatrix(vec3 euler) {
        vec3 c = cos(euler);
        vec3 s = sin(euler);

        mat4 rx = mat4(1.0, 0.0, 0.0, 0.0,  0.0, c.x, s.x, 0.0,  0.0, -s.x, c.x, 0.0,  0.0, 0.0, 0.0, 1.0);
        mat4 ry = mat4(c.y, 0.0, -s.y, 0.0,  0.0, 1.0, 0.0, 0.0,  s.y, 0.0, c.y, 0.0,  0.0, 0.0, 0.0, 1.0);
        mat4 rz = mat4(c.z, s.z, 0.0, 0.0,  -s.z, c.z, 0.0, 0.0,  0.0, 0.0, 1.0, 0.0,  0.0, 0.0, 0.0, 1.0);

        return rz * ry * rx;
      }
    ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `
      vec3 currentRotation = aInitialRotation + aRotationSpeed * uTime;
      mat4 rMat = rotationMatrix(currentRotation);
      vec3 objectNormal = (rMat * vec4(normal, 0.0)).xyz;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      vec3 transformed = (rMat * vec4(position, 1.0)).xyz;
      `
    );
  };

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[null, null, asteroidCount]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
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
