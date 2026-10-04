// CosmicDust.js - GPU-animated interplanetary dust particles
'use client';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Sphere, Vector3 } from 'three';

const dustVertexShader = `
  uniform float uTime;
  attribute vec3 color;
  varying vec3 vColor;

  void main() {
    vColor = color;

    // Rotate the entire particle system over time
    float t = uTime * 0.02;

    // Rotation Y
    mat3 rotY = mat3(
      cos(t), 0.0, sin(t),
      0.0, 1.0, 0.0,
      -sin(t), 0.0, cos(t)
    );

    // Rotation X
    float tX = t * 0.5;
    mat3 rotX = mat3(
      1.0, 0.0, 0.0,
      0.0, cos(tX), -sin(tX),
      0.0, sin(tX), cos(tX)
    );

    vec3 rotatedPosition = rotY * rotX * position;

    vec4 mvPosition = modelViewMatrix * vec4(rotatedPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // size attenuation
    gl_PointSize = 0.03 * (300.0 / -mvPosition.z);
  }
`;

const dustFragmentShader = `
  varying vec3 vColor;
  void main() {
    gl_FragColor = vec4(vColor, 0.25);
  }
`;

export default function CosmicDust({ particleCount = 1000 }) {
  const meshRef = useRef(null);
  const materialRef = useRef(null);
  
  const spread = 100;
  
  // Generate dust particle positions and colors once
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      const radius = Math.random() * spread;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3]     = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      const brightness = 0.3 + Math.random() * 0.4;
      colors[i3]     = brightness;
      colors[i3 + 1] = brightness * 0.9;
      colors[i3 + 2] = brightness * 0.8;
    }
    
    return { positions, colors };
  }, [particleCount]);

  useEffect(() => {
    if (meshRef.current && meshRef.current.geometry) {
      meshRef.current.geometry.boundingSphere = new Sphere(new Vector3(0, 0, 0), spread);
    }
  }, [spread]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  return (
    <points ref={meshRef} frustumCulled={true}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={dustVertexShader}
        fragmentShader={dustFragmentShader}
        uniforms={uniforms}
        transparent={true}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
