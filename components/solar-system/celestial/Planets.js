// Planets.js - Keplerian planet motion with adaptive rendering
'use client';

import { memo, Suspense, useCallback, useMemo, useRef } from 'react';
import { TextureLoader } from 'three';
import { useFrame, useLoader } from '@react-three/fiber';
import Ring from './GuideRing';
import Moons from './Moons';
import { usePlanetPositions } from '../contexts/PlanetPositionsContext';
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
import { useCameraActionsContext } from '../contexts/CameraContext';
import { useSpeedControlActions } from '../contexts/SpeedControlContext';
import { useSimulationClock } from '../contexts/SimulationClockContext';
import SaturnRings from './SaturnRings';
import planetsData from '../lib/planetsData';
import {
  getAxialRotationAngle,
  setVisualPlanetPosition,
} from '../lib/orbitalMechanics';

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

function Planet({
  id,
  name,
  texturePath,
  position,
  radius,
  tilt,
  rings,
  moons,
  sphereSegments = 32,
  shadows = false,
}) {
  const { updatePlanetPosition } = usePlanetPositions();
  const selectedPlanet = useSelectedPlanet();
  const setSelectedPlanet = useSelectedPlanetActions();
  const setCameraState = useCameraActionsContext();
  const { overrideSpeedFactor } = useSpeedControlActions();
  const { initialJulianDate, currentJulianDateRef } = useSimulationClock();

  const textureToLoad = texturePath || '/images/bodies/placeholder_2k.webp';
  const texture = useLoader(TextureLoader, textureToLoad);
  const visualSemiMajorAxis = position.x;
  const detailSegments = Math.max(12, Math.floor(sphereSegments / 2));
  const sphereArgs = useMemo(
    () => [radius, sphereSegments, sphereSegments],
    [radius, sphereSegments]
  );
  const atmosphereSphereArgs = useMemo(
    () => [radius * 1.03, detailSegments, detailSegments],
    [detailSegments, radius]
  );
  const initialPosition = useMemo(() => {
    const point = [visualSemiMajorAxis, 0, 0];
    setVisualPlanetPosition(name, initialJulianDate, visualSemiMajorAxis, point);
    return point;
  }, [initialJulianDate, name, visualSemiMajorAxis]);

  const planetRef = useRef(null);
  const groupRef = useRef(null);
  const currentPositionRef = useRef([...initialPosition]);

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

  const shouldRenderMoons = Boolean(
    moons?.length &&
      (selectedPlanet?.name === name ||
        (selectedPlanet?.isMoon && selectedPlanet?.parentPlanet === name))
  );

  const handlePlanetClick = useCallback(() => {
    if (!planetData) return;

    setSelectedPlanet(planetData);
    overrideSpeedFactor();
    setCameraState('ZOOMING_IN');
  }, [overrideSpeedFactor, planetData, setCameraState, setSelectedPlanet]);

  useFrame(() => {
    const julianDate = currentJulianDateRef.current;
    const currentPosition = currentPositionRef.current;
    setVisualPlanetPosition(name, julianDate, visualSemiMajorAxis, currentPosition);

    const group = groupRef.current;
    if (group) {
      group.position.set(currentPosition[0], currentPosition[1], currentPosition[2]);
    }

    updatePlanetPosition(name, currentPosition);

    const planet = planetRef.current;
    const rotationPeriodHours = planetData?.displayStats?.rotationPeriod;
    if (planet && Number.isFinite(rotationPeriodHours)) {
      planet.rotation.y = getAxialRotationAngle(rotationPeriodHours, julianDate);
    }
  });

  return (
    <>
      <group ref={groupRef} position={initialPosition} rotation={[tilt, 0, 0]}>
        <mesh
          ref={planetRef}
          onClick={handlePlanetClick}
          castShadow={shadows}
          receiveShadow={shadows}
        >
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

        {shouldRenderMoons && (
          <Suspense fallback={null}>
            <Moons
              planetPosition={[0, 0, 0]}
              moons={moons}
              planetName={name}
              planetData={planetData}
              sphereSegments={detailSegments}
            />
          </Suspense>
        )}
      </group>

      <Ring planetName={name} radius={visualSemiMajorAxis} />
    </>
  );
}

export default memo(Planet);
