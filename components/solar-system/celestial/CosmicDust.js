// CosmicDust.js - Interplanetary dust particles for enhanced realism
'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending } from 'three';

export default function CosmicDust({ particleCount = 1000 }) {
  const meshRef = useRef();
  const materialRef = useRef();
  
  const dustCount = particleCount;
  const spread = 100;
  
  // Generate dust particle positions
  const dustParticles = useMemo(() => {
    const positions = new Float32Array(dustCount * 3);
    const colors = new Float32Array(dustCount * 3);
    const phases = new Float32Array(dustCount);
    
    for (let i = 0; i < dustCount; i++) {
      const i3 = i * 3;
      
      // Random positions in a large sphere
      const radius = Math.random() * spread;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // Subtle color variations
      const brightness = 0.3 + Math.random() * 0.4;
      colors[i3] = brightness;
      colors[i3 + 1] = brightness * 0.9;
      colors[i3 + 2] = brightness * 0.8;

      phases[i] = Math.random() * Math.PI * 2;
    }
    
    return { positions, colors, phases };
  }, [dustCount]);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime() * 0.1;
      meshRef.current.rotation.y = time;
      meshRef.current.rotation.x = time * 0.5;
    }

    if (materialRef.current && materialRef.current.userData.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    materialRef.current.userData.shader = shader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `
      #include <common>
      attribute float aPhase;
      varying float vPhase;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vPhase = aPhase;
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `
      #include <common>
      uniform float uTime;
      varying float vPhase;
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
      #include <color_fragment>
      float twinkle = (sin(uTime * 2.0 + vPhase) + 1.0) * 0.5;
      diffuseColor.a *= (0.3 + 0.7 * twinkle);
      `
    );
  };

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[dustParticles.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[dustParticles.colors, 3]}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          args={[dustParticles.phases, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.02}
        vertexColors={true}
        transparent={true}
        opacity={0.3}
        blending={AdditiveBlending}
        depthWrite={false}
        onBeforeCompile={onBeforeCompile}
      />
    </points>
  );
}
