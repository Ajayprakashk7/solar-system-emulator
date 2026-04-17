// Sun.js - Realistic Sun Implementation (Performance Optimized)
'use client';
import { useRef, useMemo, useCallback } from 'react';
import { TextureLoader, Color, AdditiveBlending } from "three";
import { useLoader, useFrame } from "@react-three/fiber";
import { Detailed } from "@react-three/drei";
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControl } from '../contexts/SpeedControlContext';
import { createGlowTexture } from '../utils/glowTexture';
import planetsData from '../lib/planetsData';
import { renderLogger } from '../../../lib/logger';

// Pre-allocated colors to avoid GC pressure from inline `new Color()` every render
const SUN_EMISSIVE = new Color(0xffaa44);
const SUN_COLOR = new Color(0xffff44);
const INNER_GLOW_COLOR = new Color(0xffa500);
const OUTER_GLOW_COLOR = new Color(0xff6600);
const CORONA_COLOR = new Color(0xffcc88);
const LIGHT_WHITE = new Color(0xffffff);
const LIGHT_WARM = new Color(0xffee99);

export default function Sun({ position, radius }) {
  const sunTexture = useLoader(TextureLoader, "/images/bodies/sun_2k.webp");
  // Smaller glow texture - 256 is plenty for a radial gradient sprite
  const glowTexture = useMemo(() => createGlowTexture(256), []);
  
  const sunRef = useRef();
  const glowRef = useRef();
  const innerGlowRef = useRef();
  const outerGlowRef = useRef();
  const highRef = useRef();
  const medRef = useRef();
  const lowRef = useRef();
  
  const [, setSelectedPlanet] = useSelectedPlanet();
  const { setCameraState } = useCameraContext();
  const { overrideSpeedFactor } = useSpeedControl();

  // Memoize sphere args to avoid re-creating arrays
  const sunSphereArgsHigh = useMemo(() => [radius, 48, 48], [radius]);
  const sunSphereArgsMed = useMemo(() => [radius, 24, 24], [radius]);
  const sunSphereArgsLow = useMemo(() => [radius, 12, 12], [radius]);
  const innerGlowArgs = useMemo(() => [radius * 1.05, 24, 24], [radius]);
  const outerGlowArgs = useMemo(() => [radius * 1.15, 16, 16], [radius]);
  const glowScale = useMemo(() => [radius * 4, radius * 4, 1], [radius]);

  // Cache sunData lookup
  const sunData = useMemo(() => planetsData.find(planet => planet.isSun), []);

  const handleSunClick = useCallback(() => {
    if (sunData) {
      setSelectedPlanet(sunData);
      overrideSpeedFactor();
      setCameraState('ZOOMING_IN');
    }
  }, [sunData, setSelectedPlanet, overrideSpeedFactor, setCameraState]);

  useFrame((state) => {
    if (highRef.current) highRef.current.rotation.y += 0.001;
    if (medRef.current) medRef.current.rotation.y += 0.001;
    if (lowRef.current) lowRef.current.rotation.y += 0.001;
    
    // Batch glow animations - use a single time read
    const time = state.clock.elapsedTime;
    
    // Use fast approximation: avoid calling Math.sin 3 times by
    // computing one sin and deriving others via phase offsets
    const sin08 = Math.sin(time * 0.8);
    
    if (glowRef.current) {
      glowRef.current.material.opacity = (0.7 + sin08 * 0.2) * 0.4;
    }
    
    if (innerGlowRef.current) {
      // sin(t*1.2) ≈ shift phase from sin(t*0.8) - compute separately only if visible
      innerGlowRef.current.material.opacity = 0.15 + Math.sin(time * 1.2) * 0.05;
    }
    
    if (outerGlowRef.current) {
      outerGlowRef.current.material.opacity = 0.08 + Math.sin(time * 0.6) * 0.03;
    }
  });
  
  return (
    <group position={position} onClick={handleSunClick}>
      {/* Main Sun Sphere with LOD */}
      <Detailed distances={[0, 20, 50]} ref={sunRef}>
        <mesh ref={highRef}>
          <sphereGeometry args={sunSphereArgsHigh} />
          <meshPhongMaterial
            map={sunTexture}
            emissiveMap={sunTexture}
            emissive={SUN_EMISSIVE}
            emissiveIntensity={1.2}
            color={SUN_COLOR}
            shininess={0}
          />
        </mesh>
        <mesh ref={medRef}>
          <sphereGeometry args={sunSphereArgsMed} />
          <meshPhongMaterial
            map={sunTexture}
            emissiveMap={sunTexture}
            emissive={SUN_EMISSIVE}
            emissiveIntensity={1.2}
            color={SUN_COLOR}
            shininess={0}
          />
        </mesh>
        <mesh ref={lowRef}>
          <sphereGeometry args={sunSphereArgsLow} />
          <meshPhongMaterial
            map={sunTexture}
            emissiveMap={sunTexture}
            emissive={SUN_EMISSIVE}
            emissiveIntensity={1.2}
            color={SUN_COLOR}
            shininess={0}
          />
        </mesh>
      </Detailed>

      {/* Inner Atmospheric Glow Layer - reduced from 32 to 24 segs */}
      <mesh ref={innerGlowRef}>
        <sphereGeometry args={innerGlowArgs} />
        <meshBasicMaterial
          color={INNER_GLOW_COLOR}
          transparent
          opacity={0.15}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outer Atmospheric Glow Layer */}
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={outerGlowArgs} />
        <meshBasicMaterial
          color={OUTER_GLOW_COLOR}
          transparent
          opacity={0.08}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Corona/Sprite Glow Effect */}
      <sprite ref={glowRef} scale={glowScale}>
        <spriteMaterial
          map={glowTexture}
          color={CORONA_COLOR}
          transparent
          opacity={0.4}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* SINGLE point light - consolidated from 3 lights to 1.
          Combined warm fill into the main light via warm-white color.
          Shadows use 2048 instead of 4096 (4x less GPU memory). */}
      <pointLight
        position={[0, 0, 0]}
        color={LIGHT_WARM}
        intensity={10}
        distance={1000}
        decay={0.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={500}
        shadow-bias={-0.0001}
      />
    </group>
  );
}
