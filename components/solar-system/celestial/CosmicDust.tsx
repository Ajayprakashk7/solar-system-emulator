// CosmicDust.tsx - Interplanetary dust particles for enhanced realism
'use client';
import { useMemo, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Points } from 'three';

interface CosmicDustProps {
  particleCount?: number;
}

export default function CosmicDust({ particleCount = 1000 }: CosmicDustProps) {
  const meshRef = useRef<Points>(null);
  const materialUserData = useRef({ uTime: { value: 0 } });

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

  const onBeforeCompile = useCallback((shader: import('three').WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uTime = materialUserData.current.uTime;

    shader.vertexShader = `
      attribute float aPhase;
      varying float vPhase;
      ${shader.vertexShader}
    `;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vPhase = aPhase;
      `
    );

    shader.fragmentShader = `
      uniform float uTime;
      varying float vPhase;
      ${shader.fragmentShader}
    `;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
      #include <color_fragment>
      float twinkle = sin(uTime * 2.0 + vPhase) * 0.5 + 0.5;
      diffuseColor.a *= twinkle * 0.8 + 0.2;
      `
    );
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      meshRef.current.rotation.y = time * 0.1;
      meshRef.current.rotation.x = time * 0.05;
      materialUserData.current.uTime.value = time;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-color"
          args={[dustParticles.colors, 3]}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          args={[dustParticles.phases, 1]}
        />
        <bufferAttribute
          attach="attributes-position"
          args={[dustParticles.positions, 3]}
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
        customProgramCacheKey={() => 'CosmicDustMaterial'}
      />
    </points>
  );
}
