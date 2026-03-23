// CosmicDust.js - Interplanetary dust particles for enhanced realism
'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending } from 'three';

export default function CosmicDust({ particleCount = 1000 }) {
  const meshRef = useRef();
  
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

      // Random phase for GPU twinkling
      phases[i] = Math.random() * Math.PI * 2;
    }
    
    return { positions, colors, phases };
  }, [dustCount]);

  // Shader customization to handle twinkling on the GPU
  const onBeforeCompile = useMemo(() => (shader) => {
    shader.uniforms.uTime = { value: 0 };
    // Pass uniforms to the shader
    if (meshRef.current) {
      meshRef.current.userData.shader = shader;
    }

    shader.vertexShader = `
      uniform float uTime;
      attribute float aPhase;
      varying float vAlpha;
      ${shader.vertexShader}
    `.replace(
      `void main() {`,
      `void main() {
        // Calculate twinkle alpha based on time and random phase
        vAlpha = 0.5 + 0.5 * sin(uTime * 2.0 + aPhase);
      `
    );

    shader.fragmentShader = `
      varying float vAlpha;
      ${shader.fragmentShader}
    `.replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `vec4 diffuseColor = vec4( diffuse, opacity * vAlpha );`
    );
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      meshRef.current.rotation.y = time * 0.1;
      meshRef.current.rotation.x = time * 0.05;

      // Update shader uniform
      if (meshRef.current.userData.shader) {
        meshRef.current.userData.shader.uniforms.uTime.value = time;
      }
    }
  });

  return (
    <points ref={meshRef} frustumCulled={true} userData={{}}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={dustCount}
          array={dustParticles.positions}
          itemSize={3}
          args={[dustParticles.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={dustCount}
          array={dustParticles.colors}
          itemSize={3}
          args={[dustParticles.colors, 3]}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          count={dustCount}
          array={dustParticles.phases}
          itemSize={1}
          args={[dustParticles.phases, 1]}
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
      />
    </points>
  );
}
