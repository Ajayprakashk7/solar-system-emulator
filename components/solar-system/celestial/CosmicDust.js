// CosmicDust.js - Interplanetary dust particles for enhanced realism
'use client';
import { useMemo, useRef, useCallback } from 'react';
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

      // Random phase for twinkling
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

  const onBeforeCompile = useCallback((shader) => {
    shader.uniforms.uTime = { value: 0 };
    if (materialRef.current) {
      materialRef.current.userData.shader = shader;
    }

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `
      #include <common>
      uniform float uTime;
      attribute float aPhase;
      varying float vAlpha;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      'gl_PointSize = size;',
      `
      // Base point size
      gl_PointSize = size;
      // Add twinkling effect by modifying alpha based on time and phase
      // Frequency and amplitude
      float twinkle = sin(uTime * 2.0 + aPhase) * 0.5 + 0.5;
      vAlpha = 0.2 + twinkle * 0.8; // range from 0.2 to 1.0 multiplier
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `
      #include <common>
      varying float vAlpha;
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      `
      vec4 diffuseColor = vec4( diffuse, opacity * vAlpha );
      `
    );
  }, []);

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={dustCount}
          array={dustParticles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={dustCount}
          array={dustParticles.colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          count={dustCount}
          array={dustParticles.phases}
          itemSize={1}
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
