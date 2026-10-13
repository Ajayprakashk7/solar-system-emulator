// Planets.js - efficient visual-orbit model
'use client';

import { memo, useCallback, useMemo, useRef } from 'react';
import { TextureLoader } from 'three';
import { useFrame, useLoader } from '@react-three/fiber';
import Ring from './GuideRing';
import Moons from './Moons';
import { usePlanetPositions } from '../contexts/PlanetPositionsContext';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControl } from '../contexts/SpeedControlContext';
import SaturnRings from './SaturnRings';
import planetsData from '../lib/planetsData';

const PLANET_MATERIALS = {
  Mercury: { roughness: 0.8, metalness: 0.1 },
  Venus: { roughness: 0.3, metalness: 0 },
  Earth: { roughness: 0.7, metalness: 0 },
  Mars: { roughness: 0.9, metalness: 0.1 },
  Jupiter: { roughness: 0.4, metalness: 0 },
  Saturn: { roughness: 0.5, metalness: 0 },
  Uranus: { roughness: 0.3, metalness: 0 },
  Neptune: { roughness: 0.3, metalness: 0 },
};

const DEFAULT_MATERIAL = { roughness: 0.9, metalness: 0 };
const EARTH_ORBIT_DAYS = 365.25;
const EARTH_ORBIT_RADIANS_PER_SECOND = 0.1;

function Planet({ id, name, texturePath, position, radius, tilt, rings, moons }) {
  const { updatePlanetPosition } = usePlanetPositions();
  const [, setSelectedPlanet] = useSelectedPlanet();
  const { setCameraState } = useCameraContext();
  const { overrideSpeedFactor, speedFactor } = useSpeedControl();

  const textureToLoad = texturePath || '/images/bodies/placeholder_2k.webp';
  const texture = useLoader(TextureLoader, textureToLoad);
  const sphereArgs = useMemo(() => [radius, 32, 32], [radius]);
  const atmosphereSphereArgs = useMemo(() => [radius * 1.03, 16, 16], [radius]);
  const orbitRadius = position.x;

  const planetRef = useRef(null);
  const groupRef = useRef(null);
  const orbitProgressRef = useRef(0);
  const currentPositionRef = useRef([orbitRadius, 0, 0]);

  const materialProps = useMemo(() => {
    const config = PLANET_MATERIALS[name] || DEFAULT_MATERIAL;
    return {
      ...(texture ? { map: texture } : {}),
      ...config,
    };
  }, [name, texture]);

  const planetData = useMemo(() => planetsData.find((planet) => planet.id === id), [id]);
  const hasAtmosphere = Boolean(
    planetData?.effects?.atmosphericGlow ||
      planetData?.effects?.atmosphericScattering ||
      planetData?.effects?.clouds
  );

  const handlePlanetClick = useCallback(() => {
    if (!planetData) return;

    setSelectedPlanet(planetData);
    overrideSpeedFactor();
    setCameraState('ZOOMING_IN');
  }, [overrideSpeedFactor, planetData, setCameraState, setSelectedPlanet]);

  const rotationFactor = useMemo(() => {
    const earthRotationPeriodHours = 23.93;
    const rotationPeriodHours = planetData?.displayStats?.rotationPeriod || 24;
    const direction = rotationPeriodHours < 0 ? -1 : 1;
    return direction * (earthRotationPeriodHours / Math.abs(rotationPeriodHours)) * 2;
  }, [planetData]);

  // Derive orbital animation speed from the same period displayed in the facts
  // panel. This keeps the animation and reference data from drifting apart.
  const orbitRadiansPerSecond = useMemo(() => {
    const orbitalPeriodDays = planetData?.displayStats?.orbitalPeriod;
    if (!Number.isFinite(orbitalPeriodDays) || orbitalPeriodDays <= 0) {
      return 0;
    }

    return (EARTH_ORBIT_DAYS / orbitalPeriodDays) * EARTH_ORBIT_RADIANS_PER_SECOND;
  }, [planetData]);

  useFrame((_, delta) => {
    orbitProgressRef.current += orbitRadiansPerSecond * speedFactor * delta;

    const angle = orbitProgressRef.current;
    const currentX = Math.cos(angle) * orbitRadius;
    const currentZ = Math.sin(angle) * orbitRadius;

    if (groupRef.current) {
      groupRef.current.position.x = currentX;
      groupRef.current.position.z = currentZ;
    }

    const currentPosition = currentPositionRef.current;
    currentPosition[0] = currentX;
    currentPosition[2] = currentZ;
    updatePlanetPosition(name, currentPosition);

    if (planetRef.current) {
      planetRef.current.rotation.y += rotationFactor * delta;
    }
  });

  return (
    <>
      <group ref={groupRef} position={[orbitRadius, 0, 0]} rotation={[tilt, 0, 0]}>
        <mesh ref={planetRef} onClick={handlePlanetClick} castShadow receiveShadow>
          <sphereGeometry args={sphereArgs} />
          <meshStandardMaterial {...materialProps} />
        </mesh>

        {hasAtmosphere && (
          <mesh>
            <sphereGeometry args={atmosphereSphereArgs} />
            <meshBasicMaterial
              color={planetData?.effects?.clouds ? '#ffffff' : '#d4f1ff'}
              transparent
              opacity={0.14}
              depthWrite={false}
            />
          </mesh>
        )}

        {rings && (
          <SaturnRings
            texturePath={rings.texturePath}
            innerRadius={rings.size[0]}
            outerRadius={rings.size[1]}
          />
        )}

        {moons?.length > 0 && (
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

export default memo(Planet);
