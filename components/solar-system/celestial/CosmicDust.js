// CosmicDust.js - GPU-animated interplanetary dust particles with custom shader
'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending } from 'three';

const dustVertexShader = `
  attribute vec3 color;
  attribute float size;
  attribute float phase;
  attribute float speed;

  varying vec3 vColor;

  uniform float time;

  void main() {
    vColor = color;

    // Add some organic movement
    vec3 pos = position;
    pos.x += sin(time * speed + phase) * 2.0;
    pos.y += cos(time * speed * 0.8 + phase) * 2.0;
    pos.z += sin(time * speed * 1.2 + phase) * 2.0;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Size attenuation based on distance
    gl_PointSize = size * (300.0 / -mvPosition.z);

    // Pulse size slightly
    gl_PointSize *= 1.0 + 0.3 * sin(time * 2.0 + phase);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const dustFragmentShader = `
  varying vec3 vColor;

  void main() {
    // Make particles circular with soft edges
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;

    // Soft particle edge
    float alpha = (0.5 - r) * 2.0;

    gl_FragColor = vec4(vColor, alpha * 0.4); // Overall opacity
  }
`;

export default function CosmicDust({ particleCount = 2000 }) {
  const meshRef = useRef();
  
  const spread = 150;
  
  const { positions, colors, sizes, phases, speeds } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    
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

      sizes[i] = Math.random() * 0.5 + 0.1;
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = Math.random() * 0.5 + 0.1;
    }
    
    return { positions, colors, sizes, phases, speeds };
  }, [particleCount]);

  const uniforms = useMemo(() => ({
    time: { value: 0.0 }
  }), []);

  useFrame((state) => {
    if (meshRef.current) {
      // Update shader time uniform
      meshRef.current.material.uniforms.time.value = state.clock.elapsedTime;

      // Slow global rotation
      const t = state.clock.elapsedTime * 0.02;
      meshRef.current.rotation.y = t;
      meshRef.current.rotation.x = t * 0.5;
    }
  });

  return (
    <points ref={meshRef} frustumCulled={false}>
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
        <bufferAttribute
          attach="attributes-phase"
          count={particleCount}
          array={phases}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-speed"
          count={particleCount}
          array={speeds}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={dustVertexShader}
        fragmentShader={dustFragmentShader}
        uniforms={uniforms}
        transparent
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
