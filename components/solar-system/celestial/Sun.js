// Sun.js - Realistic Sun Implementation
'use client';
import React, { useRef, useMemo } from 'react';
import { TextureLoader, Color, AdditiveBlending } from "three";
import { useLoader, useFrame } from "@react-three/fiber";
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControl } from '../contexts/SpeedControlContext';
import { createGlowTexture } from '../utils/glowTexture';
import planetsData from '../lib/planetsData';
import { renderLogger } from '../../../lib/logger';

function Sun({ position, radius }) {
  // Always call hooks unconditionally - React Hook rules
  const sunTexture = useLoader(TextureLoader, "/images/bodies/sun_2k.webp");
  const glowTexture = useMemo(() => createGlowTexture(512), []);
  
  const sunRef = useRef();
  const glowRef = useRef();
  const innerGlowRef = useRef();
  const outerGlowRef = useRef();
  
  const [, setSelectedPlanet] = useSelectedPlanet();
  const { setCameraState } = useCameraContext();
  const { overrideSpeedFactor } = useSpeedControl();

  const handleSunClick = () => {
    try {
      const sunData = planetsData.find(planet => planet.isSun);
      if (sunData) {
        setSelectedPlanet(sunData);
        overrideSpeedFactor();
        setCameraState('ZOOMING_IN');
      }
    } catch (error) {
      renderLogger.error('Error handling sun click:', error);
    }
  };

  useFrame((state) => {
    try {
      if (sunRef.current) {
        // Realistic solar rotation (Sun rotates once every 25 days)
        sunRef.current.rotation.y += 0.001;
      }
      
      // Animate glow layers for solar activity simulation
      const time = state.clock.getElapsedTime();
      
      if (glowRef.current && glowRef.current.material) {
        const pulseIntensity = 0.7 + Math.sin(time * 0.8) * 0.2;
        glowRef.current.material.opacity = pulseIntensity * 0.4;
      }
      
      if (innerGlowRef.current && innerGlowRef.current.material) {
        const innerPulse = 0.15 + Math.sin(time * 1.2) * 0.05;
        innerGlowRef.current.material.opacity = innerPulse;
      }
      
      if (outerGlowRef.current && outerGlowRef.current.material) {
        const outerPulse = 0.08 + Math.sin(time * 0.6) * 0.03;
        outerGlowRef.current.material.opacity = outerPulse;
      }
    } catch (error) {
      renderLogger.error('Error in Sun animation frame:', error);
    }
  });
  
  return (
    <group position={position} onClick={handleSunClick}>
      {/* Main Sun Sphere with realistic material */}
      <mesh ref={sunRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshPhongMaterial
          map={sunTexture}
          emissiveMap={sunTexture}
          emissive={new Color(0xffaa44)}
          emissiveIntensity={1.2}
          color={new Color(0xffff44)}
          shininess={0}
        />
      </mesh>

      {/* Inner Atmospheric Glow Layer */}
      <mesh ref={innerGlowRef}>
        <sphereGeometry args={[radius * 1.05, 32, 32]} />
        <meshBasicMaterial
          color={new Color(0xffa500)}
          transparent={true}
          opacity={0.15}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outer Atmospheric Glow Layer */}
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[radius * 1.15, 16, 16]} />
        <meshBasicMaterial
          color={new Color(0xff6600)}
          transparent={true}
          opacity={0.08}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Corona/Sprite Glow Effect */}
      <sprite ref={glowRef} scale={[radius * 4, radius * 4, 1]}>
        <spriteMaterial
          map={glowTexture}
          color={new Color(0xffcc88)}
          transparent={true}
          opacity={0.4}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* Point Light - Sun as primary light source with realistic properties */}
      {/* Main sunlight - significantly increased intensity and range */}
      <pointLight
        position={[0, 0, 0]}
        color={new Color(0xffffff)}
        intensity={8}  // Increased from 4
        distance={1000}  // Increased from 300
        decay={0.25}  // Reduced decay for longer reach
        castShadow={true}
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={0.1}
        shadow-camera-far={1000}  // Increased from 200
        shadow-bias={-0.0001}
      />
      
      {/* Warm fill light for better planet illumination */}
      <pointLight
        position={[0, 0, 0]}
        color={new Color(0xffcc99)}
        intensity={4}  // Increased from 2
        distance={800}  // Increased from 150
        decay={0.3}  // Reduced decay for better reach
      />
      
      {/* Directional light for better shadow casting */}
      <directionalLight
        position={[0, 0, 0]}
        intensity={1.5}
        color={0xffffff}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={800}
        shadow-bias={-0.0001}
      />
    </group>
  );
}

export default React.memo(Sun);