// AsteroidBelt.js - Performance-optimized asteroid belt
'use client';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, MathUtils, Sphere, Vector3 } from 'three';

export default function AsteroidBelt({ asteroidCount = 500 }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const tempObject = useMemo(() => new Object3D(), []);
  
  const innerRadius = 3.5;
  const outerRadius = 4.8;
  
  // Pre-compute all asteroid transforms and rotation attributes once
  const asteroidData = useMemo(() => {
    const positions = new Float32Array(asteroidCount * 3);
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
      
      const axis = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      rotationAxes[i3] = axis.x;
      rotationAxes[i3 + 1] = axis.y;
      rotationAxes[i3 + 2] = axis.z;
      
      rotationSpeeds[i] = (Math.random() - 0.5) * 2.0;
      scales[i] = MathUtils.lerp(0.002, 0.008, Math.random());
    }
    
    return { positions, rotationAxes, rotationSpeeds, scales };
  }, [asteroidCount]);

  // Set initial instance matrices and bounding sphere once on mount
  useEffect(() => {
    if (!meshRef.current) return;
    const { positions, scales } = asteroidData;
    
    for (let i = 0; i < asteroidCount; i++) {
      const i3 = i * 3;
      tempObject.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      tempObject.rotation.set(0, 0, 0);
      tempObject.scale.setScalar(scales[i]);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    // Fixed bounding sphere for frustum culling
    meshRef.current.boundingSphere = new Sphere(new Vector3(0, 0, 0), outerRadius + 1.0);
  }, [asteroidCount, asteroidData, tempObject, outerRadius]);

  const groupRef = useRef();

  useFrame((state) => {
    // Slow group rotation for overall belt movement
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
    // Update shader time uniform for GPU rotation
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const vertexShader = `
    uniform float uTime;
    attribute vec3 rotationAxis;
    attribute float rotationSpeed;
    
    varying vec3 vNormal;
    
    vec3 rotateVectorByQuaternion(vec3 v, vec4 q) {
      return 2.0 * cross(q.xyz, v * q.w + cross(q.xyz, v)) + v;
    }

    void main() {
      float angle = uTime * rotationSpeed;
      float halfAngle = angle * 0.5;
      float s = sin(halfAngle);
      vec4 q = vec4(rotationAxis * s, cos(halfAngle));
      
      vec3 rotatedPosition = rotateVectorByQuaternion(position, q);
      vec3 rotatedNormal = rotateVectorByQuaternion(normal, q);

      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(rotatedPosition, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      vNormal = normalMatrix * mat3(instanceMatrix) * rotatedNormal;
    }
  `;

  const fragmentShader = `
    varying vec3 vNormal;

    void main() {
      // Fake directional lighting to mimic the standard material
      vec3 lightDir = normalize(vec3(10.0, 5.0, 5.0));
      float diff = max(dot(normalize(vNormal), lightDir), 0.2);

      vec3 color = vec3(0.54, 0.27, 0.07); // #8B4513
      gl_FragColor = vec4(color * diff, 1.0);
    }
  `;

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[null, null, asteroidCount]} frustumCulled={true}>
        <icosahedronGeometry args={[1, 0]}>
          <instancedBufferAttribute attach="attributes-rotationAxis" args={[asteroidData.rotationAxes, 3]} />
          <instancedBufferAttribute attach="attributes-rotationSpeed" args={[asteroidData.rotationSpeeds, 1]} />
        </icosahedronGeometry>
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={{ uTime: { value: 0 } }}
        />
      </instancedMesh>
    </group>
  );
}