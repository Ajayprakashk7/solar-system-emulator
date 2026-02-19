// Planets.js - Enhanced with realistic astrophysics
'use client';
import { useMemo, useEffect, useRef } from "react";
import { TextureLoader } from "three";
import { useLoader, useFrame } from "@react-three/fiber";
import Ring from "./GuideRing";
import Moons from "./Moons";
import { usePlanetPositions } from "../contexts/PlanetPositionsContext";
import { useSelectedPlanet } from "../contexts/SelectedPlanetContext";
import { useCameraContext } from "../contexts/CameraContext";
import { useSpeedControl } from "../contexts/SpeedControlContext";
import SaturnRings from "./SaturnRings";
import planetsData from "../lib/planetsData";
import { renderLogger } from '../../../lib/logger';
import { sphereGeometry, lowPolySphereGeometry } from '../utils/sharedGeometries';

export default function Planet({
  id,
  name,
  texturePath,
  position,
  radius,
  orbitSpeed,
  tilt,
  rings,
  moons,
}) {
  const { updatePlanetPosition } = usePlanetPositions();
  const [, setSelectedPlanet] = useSelectedPlanet();
  const { setCameraState } = useCameraContext();
  const { overrideSpeedFactor, speedFactor } = useSpeedControl();
  
  // Load planet texture with error handling
  const textureToLoad = texturePath || "/images/bodies/placeholder_2k.webp";
  const texture = useLoader(TextureLoader, textureToLoad);
  
  // Realistic orbital mechanics
  const orbitRadius = position.x;
  
  const ref = useRef(null);
  const groupRef = useRef(null);
  const atmosphereRef = useRef(null);
  const orbitProgressRef = useRef(0);

  // Debug: Log when planet has moons
  useEffect(() => {
    if (moons && moons.length > 0) {
      renderLogger.debug(`[Planet ${name}] Has ${moons.length} moons:`, moons.map(m => m.name).join(', '));
    }
  }, [name, moons]);

  // Planet-specific material properties for realism
  const materialProps = useMemo(() => {
    const baseProps = {
      ...(texture ? { map: texture } : {}),
      roughness: 0.9,
      metalness: 0.0,
    };

    switch (name) {
      case 'Mercury':
        return { ...baseProps, roughness: 0.8, metalness: 0.1 };
      case 'Venus':
        return { ...baseProps, roughness: 0.3, metalness: 0.0 };
      case 'Earth':
        return { ...baseProps, roughness: 0.7, metalness: 0.0 };
      case 'Mars':
        return { ...baseProps, roughness: 0.9, metalness: 0.1 };
      case 'Jupiter':
        return { ...baseProps, roughness: 0.4, metalness: 0.0 };
      case 'Saturn':
        return { ...baseProps, roughness: 0.5, metalness: 0.0 };
      case 'Uranus':
        return { ...baseProps, roughness: 0.3, metalness: 0.0 };
      case 'Neptune':
        return { ...baseProps, roughness: 0.3, metalness: 0.0 };
      default:
        return baseProps;
    }
  }, [texture, name]);

  // Use new realData and effects for advanced rendering
  const planetData = useMemo(() => planetsData.find(p => p.id === id), [id]);
  const hasAtmosphere = planetData?.effects?.atmosphericGlow || planetData?.effects?.atmosphericScattering || planetData?.effects?.clouds;
  const hasClouds = planetData?.effects?.clouds;
  const hasAurora = planetData?.effects?.aurora || planetData?.effects?.aurorae;
  const hasDust = planetData?.effects?.dustStorms;
  const hasPolarCaps = planetData?.effects?.polarCaps;

  const handlePlanetClick = () => {
    const planetData = planetsData.find(planet => planet.id === id);
    if (planetData) {
      setSelectedPlanet(planetData);
      overrideSpeedFactor();
      setCameraState('ZOOMING_IN');
    }
  };

  useFrame((state, delta) => {
    // Orbital mechanics
    const ORBIT_SPEED_FACTOR = 50;
    // Kepler's laws: orbital speed decreases with distance from Sun
    const keplerFactor = Math.sqrt(1 / Math.pow(orbitRadius, 3));

    const orbitSpeedRadians =
      ((orbitSpeed * ORBIT_SPEED_FACTOR * keplerFactor) / 360) *
      (2 * Math.PI) *
      speedFactor;

    orbitProgressRef.current += orbitSpeedRadians * delta;

    const angle = orbitProgressRef.current;
    const currentX = Math.cos(angle) * orbitRadius;
    const currentZ = Math.sin(angle) * orbitRadius;

    if (groupRef.current) {
      groupRef.current.position.set(currentX, 0, currentZ);
    }

    // Update global position ref for camera controller (no re-renders)
    updatePlanetPosition(name, [currentX, 0, currentZ]);

    if (ref.current) {
      // Calculate rotation using actual planetary rotation periods
      // rotationPeriod from displayStats is in Earth hours
      // Convert to radians per frame for realistic rotation
      const earthRotationPeriod = 23.93; // hours
      const rotationPeriodHours = planetData?.displayStats?.rotationPeriod || 24;
      
      // Calculate rotation speed relative to Earth
      // Negative values (like Venus) will rotate in opposite direction
      const rotationSpeedFactor = earthRotationPeriod / rotationPeriodHours;
      
      // Scale for visibility (planets would rotate too slowly otherwise)
      const visibilityScale = 2.0;
      const rotationAmount = rotationSpeedFactor * delta * visibilityScale;
      
      ref.current.rotation.y += rotationAmount;
    }
    
    // Add subtle atmospheric glow for gas giants
    if (atmosphereRef.current?.material) {
      const time = state.clock.getElapsedTime();
      const pulse = 0.8 + Math.sin(time * 0.5) * 0.2;
      atmosphereRef.current.material.opacity = pulse * 0.1;
    }
  });

  return (
    <>
      <group ref={groupRef} position={[orbitRadius, 0, 0]} rotation={[tilt, 0, 0]}>
        {/* Main planet mesh with enhanced materials - Using shared geometry */}
        <mesh
          ref={ref}
          onClick={handlePlanetClick}
          castShadow
          receiveShadow
          geometry={sphereGeometry}
          scale={[radius, radius, radius]}
        >
          <meshStandardMaterial 
              {...materialProps}
              clearcoat={hasAtmosphere ? 0.3 : 0.0}
              clearcoatRoughness={hasAtmosphere ? 0.2 : 1.0}
              sheen={hasClouds ? 0.5 : 0.0}
              sheenColor={hasClouds ? '#ffffff' : undefined}
              transmission={hasAtmosphere ? 0.1 : 0.0}
              ior={hasAtmosphere ? 1.1 : 1.0}
              emissive={hasAurora ? '#44eaff' : '#000000'}
              emissiveIntensity={hasAurora ? 0.2 : 0.0}
            />
        </mesh>

        {/* Enhanced atmospheric layer for better visibility */}
        {hasAtmosphere && (
          <mesh
            ref={atmosphereRef}
            geometry={sphereGeometry}
            scale={[radius * 1.03, radius * 1.03, radius * 1.03]}
          >
              <meshPhysicalMaterial
                color={hasClouds ? '#ffffff' : '#d4f1ff'}
                transparent={true}
                opacity={hasClouds ? 0.25 : 0.15}
                roughness={0.2}
                metalness={0.0}
                clearcoat={0.7}
                clearcoatRoughness={0.1}
                transmission={0.4}
                ior={1.15}
                thickness={0.5}
                depthWrite={false}
                // Add subsurface scattering for more realistic atmosphere
                sheen={0.3}
                sheenColor={'#a0d8ff'}
                sheenRoughness={0.8}
              />
          </mesh>
        )}

        {/* Polar caps for Mars and Earth - Using low poly shared geometry */}
        {hasPolarCaps && (
          <mesh
            geometry={lowPolySphereGeometry}
            scale={[radius * 1.01, radius * 1.01, radius * 1.01]}
          >
              <meshBasicMaterial
                attach="material"
                color={'#f8f8ff'}
                transparent={true}
                opacity={0.18}
                depthWrite={false}
              />
          </mesh>
        )}

        {/* Dust storms for Mars */}
        {hasDust && (
          <mesh
            geometry={lowPolySphereGeometry}
            scale={[radius * 1.04, radius * 1.04, radius * 1.04]}
          >
              <meshBasicMaterial
                attach="material"
                color={'#e0b97a'}
                transparent={true}
                opacity={0.08}
                depthWrite={false}
              />
          </mesh>
        )}

        {/* Enhanced ring system */}
        {rings && (
          <SaturnRings
            texturePath={rings.texturePath}
            innerRadius={rings.size[0]}
            outerRadius={rings.size[1]}
          />
        )}

        {/* Point light for gas giants (they emit some heat) */}
        {(name === 'Jupiter' || name === 'Saturn') && (
          <pointLight
            position={[0, 0, 0]}
            intensity={0.1}
            distance={radius * 5}
            color={name === 'Jupiter' ? '#ff8844' : '#ffcc88'}
          />
        )}

        {/* Render moons if planet has any */}
        {moons && moons.length > 0 && (
          <Moons
            planetPosition={[0, 0, 0]}
            moons={moons}
            planetName={name}
            planetData={planetData}
            adaptiveDetail={true}
          />
        )}
      </group>
      
      {/* Orbital guide ring */}
      <Ring radius={orbitRadius} />
    </>
  );
}
