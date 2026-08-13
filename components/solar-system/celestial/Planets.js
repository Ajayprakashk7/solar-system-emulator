// Planets.js - Enhanced with realistic astrophysics (Performance Optimized)
'use client';
import { useMemo, useRef, useCallback, memo, useState } from "react";
import { TextureLoader } from "three";
import { useLoader, useFrame } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import Ring from "./GuideRing";
import Moons from "./Moons";
import { usePlanetPositions } from "../contexts/PlanetPositionsContext";
import { useSelectedPlanet } from "../contexts/SelectedPlanetContext";
import { useCameraContext } from "../contexts/CameraContext";
import { useSpeedControl } from "../contexts/SpeedControlContext";
import SaturnRings from "./SaturnRings";
import planetsData from "../lib/planetsData";

// Pre-compute planet material configs to avoid switch statement per-render
const PLANET_MATERIALS = {
  Mercury:  { roughness: 0.8, metalness: 0.1 },
  Venus:    { roughness: 0.3, metalness: 0.0 },
  Earth:    { roughness: 0.7, metalness: 0.0 },
  Mars:     { roughness: 0.9, metalness: 0.1 },
  Jupiter:  { roughness: 0.4, metalness: 0.0 },
  Saturn:   { roughness: 0.5, metalness: 0.0 },
  Uranus:   { roughness: 0.3, metalness: 0.0 },
  Neptune:  { roughness: 0.3, metalness: 0.0 },
};

const DEFAULT_MATERIAL = { roughness: 0.9, metalness: 0.0 };

function Planet({
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
  
  const textureToLoad = texturePath || "/images/bodies/placeholder_2k.webp";
  const texture = useLoader(TextureLoader, textureToLoad);
  
  // Reduced from 64 to 32 segments - still visually smooth, ~75% fewer vertices
  const sphereArgs = useMemo(() => [radius, 32, 32], [radius]);
  // Atmosphere only needs 16 segments - it's translucent, detail doesn't matter
  const atmosphereSphereArgs = useMemo(() => [radius * 1.03, 16, 16], [radius]);
  
  const orbitRadius = position.x;
  
  const ref = useRef(null);
  const groupRef = useRef(null);
  const atmosphereRef = useRef(null);
  const orbitProgressRef = useRef(0);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered, 'pointer', 'auto');

  // Material props: lookup from static map instead of switch per render
  const materialProps = useMemo(() => {
    const config = PLANET_MATERIALS[name] || DEFAULT_MATERIAL;
    return {
      ...(texture ? { map: texture } : {}),
      ...config,
    };
  }, [texture, name]);

  const planetData = useMemo(() => planetsData.find(p => p.id === id), [id]);
  const hasAtmosphere = planetData?.effects?.atmosphericGlow || planetData?.effects?.atmosphericScattering || planetData?.effects?.clouds;

  const handlePlanetClick = useCallback(() => {
    if (planetData) {
      setSelectedPlanet(planetData);
      overrideSpeedFactor();
      setCameraState('ZOOMING_IN');
    }
  }, [planetData, setSelectedPlanet, overrideSpeedFactor, setCameraState]);

  // Pre-compute rotation factor to avoid per-frame division
  const rotationFactor = useMemo(() => {
    const earthRotationPeriod = 23.93;
    const rotationPeriodHours = planetData?.displayStats?.rotationPeriod || 24;
    // Math.abs handles retrograde rotation (Venus, Uranus).
    // Sign is applied separately to get correct direction.
    const sign = rotationPeriodHours < 0 ? -1 : 1;
    const factor = earthRotationPeriod / Math.abs(rotationPeriodHours);
    return sign * factor * 2.0; // 2.0 = visibility scale
  }, [planetData]);

  // Pre-compute Kepler orbital factor
  const keplerOrbitFactor = useMemo(() => {
    const ORBIT_SPEED_FACTOR = 50;
    const keplerFactor = Math.sqrt(1 / Math.pow(orbitRadius, 3));
    return ((orbitSpeed * ORBIT_SPEED_FACTOR * keplerFactor) / 360) * (2 * Math.PI);
  }, [orbitSpeed, orbitRadius]);

  useFrame((state, delta) => {
    // Orbital position
    orbitProgressRef.current += keplerOrbitFactor * speedFactor * delta;

    const angle = orbitProgressRef.current;
    const currentX = Math.cos(angle) * orbitRadius;
    const currentZ = Math.sin(angle) * orbitRadius;

    if (groupRef.current) {
      groupRef.current.position.x = currentX;
      groupRef.current.position.z = currentZ;
    }

    updatePlanetPosition(name, [currentX, 0, currentZ]);

    // Self-rotation
    if (ref.current) {
      ref.current.rotation.y += rotationFactor * delta;
    }
    
    // Atmospheric pulse - only if the ref exists & has atmosphere
    if (atmosphereRef.current) {
      atmosphereRef.current.material.opacity = 0.8 + Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <>
      <group ref={groupRef} position={[orbitRadius, 0, 0]} rotation={[tilt, 0, 0]}>
        {/* Main planet mesh - simplified material (no clearcoat/transmission/sheen/ior
            which silently upgrade to MeshPhysicalMaterial - extremely expensive shader) */}
        <mesh
          ref={ref}
          onClick={handlePlanetClick}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
          onPointerOut={() => setHovered(false)}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={sphereArgs} />
          <meshStandardMaterial {...materialProps} />
        </mesh>

        {/* Lightweight atmosphere layer - meshBasicMaterial instead of meshPhysicalMaterial.
            The old meshPhysicalMaterial with transmission+clearcoat+sheen was the
            single most expensive material in the scene per-planet. */}
        {hasAtmosphere && (
          <mesh ref={atmosphereRef}>
            <sphereGeometry args={atmosphereSphereArgs} />
            <meshBasicMaterial
              color={planetData?.effects?.clouds ? '#ffffff' : '#d4f1ff'}
              transparent
              opacity={0.12}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Ring system */}
        {rings && (
          <SaturnRings
            texturePath={rings.texturePath}
            innerRadius={rings.size[0]}
            outerRadius={rings.size[1]}
          />
        )}

        {/* Render moons if planet has any */}
        {moons && moons.length > 0 && (
          <Moons
            planetPosition={[0, 0, 0]}
            moons={moons}
            planetName={name}
            planetData={planetData}
          />
        )}
      </group>
      
      <Ring radius={orbitRadius} />
    </>
  );
}

// Wrap in React.memo - planets only need to re-render when their props change
export default memo(Planet);
