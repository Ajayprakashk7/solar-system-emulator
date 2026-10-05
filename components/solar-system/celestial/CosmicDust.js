// CosmicDust.js - GPU-animated interplanetary dust particles
'use client';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Sphere, Vector3, ShaderMaterial } from 'three';

export default function CosmicDust({ particleCount = 1000 }) {
  const meshRef = useRef();
  
  const spread = 100;
  
  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
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

      sizes[i] = Math.random();
    }
    
    return { positions, colors, sizes };
  }, [particleCount]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.geometry.boundingSphere = new Sphere(new Vector3(0,0,0), spread);
    }
  }, [spread]);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime * 0.02;
      meshRef.current.rotation.y = t;
      meshRef.current.rotation.x = t * 0.5;
    }
  });

  const material = useMemo(() => new ShaderMaterial({
    uniforms: {},
    vertexShader: `
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        if(d > 0.5) discard;
        gl_FragColor = vec4(vColor, (0.5 - d) * 0.5);
      }
    `,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    vertexColors: true
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
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <primitive object={material} attach="material" />
    </points>
  );
}
