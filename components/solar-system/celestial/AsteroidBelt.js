// AsteroidBelt.js - Performance-optimized asteroid belt
'use client';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Vector3, Color, Object3D } from 'three';

const vertexShader = `
  uniform float uTime;
  attribute vec3 aRotationAxis;
  attribute float aRotationSpeed;

  varying vec3 vNormal;

  vec3 rotateVector(vec3 v, vec3 axis, float angle) {
    float halfAngle = angle * 0.5;
    float s = sin(halfAngle);
    vec4 q = vec4(axis * s, cos(halfAngle));
    vec3 t = 2.0 * cross(q.xyz, v);
    return v + q.w * t + cross(q.xyz, t);
  }

  void main() {
    float angle = aRotationSpeed * uTime;

    // Local rotation for tumbling
    vec3 rotatedPosition = rotateVector(position, aRotationAxis, angle);
    vec3 rotatedNormal = rotateVector(normal, aRotationAxis, angle);

    // Apply instance matrix which contains the position and scale
    mat4 instanceMat = instanceMatrix;
    vec4 worldPosition = instanceMat * vec4(rotatedPosition, 1.0);

    vec4 mvPosition = modelViewMatrix * worldPosition;
    gl_Position = projectionMatrix * mvPosition;

    vNormal = normalMatrix * mat3(instanceMat) * rotatedNormal;
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  varying vec3 vNormal;

  void main() {
    vec3 normal = normalize(vNormal);
    // Simple fixed light direction
    vec3 lightDir = normalize(vec3(5.0, 3.0, 5.0));
    float diff = max(dot(normal, lightDir), 0.0);

    vec3 ambient = uColor * 0.2;
    vec3 diffuse = uColor * diff * 0.8;

    gl_FragColor = vec4(ambient + diffuse, 1.0);
  }
`;

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef(null);
  const materialRef = useRef(null);
  const groupRef = useRef(null);
  
  const innerRadius = 3.5;
  const outerRadius = 4.8;
  
  const { positions, scales, rotationAxes, rotationSpeeds } = useMemo(() => {
    const positions = new Float32Array(asteroidCount * 3);
    const scales = new Float32Array(asteroidCount);
    const rotationAxes = new Float32Array(asteroidCount * 3);
    const rotationSpeeds = new Float32Array(asteroidCount);
    
    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const radius = innerRadius + (outerRadius - innerRadius) * Math.random();
      
      const i3 = i * 3;
      positions[i3]     = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      positions[i3 + 1] = (Math.random() - 0.5) * 0.3;
      positions[i3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      
      scales[i] = 0.002 + Math.random() * 0.006;
      
      // Random axis
      const u = Math.random() * Math.PI * 2;
      const v = Math.acos(2 * Math.random() - 1);
      rotationAxes[i3] = Math.sin(v) * Math.cos(u);
      rotationAxes[i3 + 1] = Math.sin(v) * Math.sin(u);
      rotationAxes[i3 + 2] = Math.cos(v);
      
      rotationSpeeds[i] = (Math.random() - 0.5) * 2.0;
    }
    
    return { positions, scales, rotationAxes, rotationSpeeds };
  }, [asteroidCount]);

  useEffect(() => {
    if (!meshRef.current) return;
    
    meshRef.current.boundingSphere = new Sphere(new Vector3(0, 0, 0), outerRadius + 1.0);

    // Set instance matrices for position and scale
    const dummy = new Object3D();
    for (let i = 0; i < asteroidCount; i++) {
      dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      dummy.scale.setScalar(scales[i]);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroidCount, positions, scales]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new Color("#8B4513") }
  }), []);

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[null, null, asteroidCount]} frustumCulled={true}>
        <icosahedronGeometry args={[1, 0]}>
          <instancedBufferAttribute attach="attributes-aRotationAxis" args={[rotationAxes, 3]} />
          <instancedBufferAttribute attach="attributes-aRotationSpeed" args={[rotationSpeeds, 1]} />
        </icosahedronGeometry>
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </instancedMesh>
    </group>
  );
}
