// CosmicDust.js - Interplanetary dust particles for enhanced realism
'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending } from 'three';

export default function CosmicDust({ particleCount = 1000 }) {
  const meshRef = useRef();
  
  const dustCount = particleCount;
  const spread = 100;
  
  // Generate dust particle positions and properties
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

      // Phase for twinkling effect
      phases[i] = Math.random() * Math.PI * 2;
    }
    
    return { positions, colors, phases };
  }, [dustCount]);

  const customMaterial = useMemo(() => {
    return {
      userData: {},
      onBeforeCompile: (shader) => {
        shader.uniforms.uTime = { value: 0 };

        shader.vertexShader = `
          uniform float uTime;
          attribute float aPhase;
          varying float vAlpha;
          ${shader.vertexShader}
        `.replace(
          '#include <color_vertex>',
          `
          #include <color_vertex>
          // Calculate twinkle alpha in vertex shader to pass to fragment
          vAlpha = 0.5 + 0.5 * sin(uTime * 2.0 + aPhase);
          `
        );

        shader.fragmentShader = `
          varying float vAlpha;
          ${shader.fragmentShader}
        `.replace(
          'vec4 diffuseColor = vec4( diffuse, opacity );',
          `
          vec4 diffuseColor = vec4( diffuse, opacity * vAlpha );
          `
        );

        customMaterial.userData.shader = shader;
      }
    };
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      // Slower overall rotation
      meshRef.current.rotation.y = time * 0.05;
      meshRef.current.rotation.x = time * 0.025;

      // Update shader time uniform for twinkling
      if (customMaterial.userData?.shader) {
        customMaterial.userData.shader.uniforms.uTime.value = time;
      }
    }
  });

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
        onBeforeCompile={customMaterial.onBeforeCompile}
      />
    </points>
  );
}
