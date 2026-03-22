// CosmicDust.js - Interplanetary dust particles for enhanced realism
'use client';
import { useMemo, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending } from 'three';

export default function CosmicDust({ particleCount = 1000 }) {
  const meshRef = useRef();
  const materialUserData = useRef({ shader: null }).current;
  
  const dustCount = particleCount;
  const spread = 100;
  
  // Generate dust particle positions and phases
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

    if (materialUserData.shader) {
      materialUserData.shader.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const onBeforeCompile = useCallback((shader) => {
    shader.uniforms.uTime = { value: 0 };

    // Add uniform and attribute to vertex shader
    shader.vertexShader = `
      uniform float uTime;
      attribute float aPhase;
      varying float vAlpha;
      ${shader.vertexShader}
    `;

    // Calculate alpha in vertex shader based on time and phase
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      // Oscillate alpha between 0.2 and 1.0
      vAlpha = 0.6 + 0.4 * sin(uTime * 2.0 + aPhase);
      `
    );

    // Pass varying alpha to fragment shader
    shader.fragmentShader = `
      varying float vAlpha;
      ${shader.fragmentShader}
    `;

    // Apply varying alpha to output color
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
      #include <color_fragment>
      diffuseColor.a *= vAlpha;
      `
    );

    materialUserData.shader = shader;
  }, [materialUserData]);

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
        size={0.02}
        vertexColors={true}
        transparent={true}
        opacity={0.3}
        blending={AdditiveBlending}
        depthWrite={false}
        onBeforeCompile={onBeforeCompile}
        userData={materialUserData}
      />
    </points>
  );
}
