// Moons.js - on-demand moon rendering driven by physical orbital periods
'use client';

import { memo, useCallback, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Color, TextureLoader, Vector3 } from 'three';
import { useSpeedControlActions } from '../contexts/SpeedControlContext';
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSimulationClock } from '../contexts/SimulationClockContext';
import { J2000_JULIAN_DATE } from '../lib/orbitalMechanics';
import { unitRandomFromString } from '../utils/deterministicRandom';

const FALLBACK_TEXTURE = '/images/bodies/moon_2k.webp';
const TWO_PI = Math.PI * 2;

const MOON_TEXTURE_PATHS = {
  Moon: '/images/bodies/moon_2k.webp',
  Phobos: '/images/bodies/mercury_2k.webp',
  Deimos: '/images/bodies/mercury_2k.webp',
  Io: '/images/moons/io_2k.webp',
  Europa: '/images/moons/europa_2k.webp',
  Ganymede: '/images/moons/ganymede_2k.webp',
  Callisto: '/images/moons/callisto_2k.webp',
  Mimas: '/images/moons/mimas_1k.webp',
  Enceladus: '/images/moons/enceladus_1k.webp',
  Tethys: '/images/bodies/moon_2k.webp',
  Dione: '/images/bodies/moon_2k.webp',
  Rhea: '/images/moons/rhea_1k.webp',
  Titan: '/images/moons/titan_2k.webp',
  Iapetus: '/images/bodies/mercury_2k.webp',
  Miranda: '/images/bodies/moon_2k.webp',
  Ariel: '/images/bodies/moon_2k.webp',
  Umbriel: '/images/bodies/mercury_2k.webp',
  Titania: '/images/bodies/moon_2k.webp',
  Oberon: '/images/bodies/moon_2k.webp',
  Triton: '/images/moons/triton_1k.webp',
  Proteus: '/images/bodies/mercury_2k.webp',
};

// Sidereal orbital periods in Earth days. Triton is negative because its orbit
// is retrograde. The visual orbit radii remain intentionally scaled so these
// moons are visible beside their parent planets.
const MOON_ORBITAL_PERIOD_DAYS = {
  Moon: 27.321661,
  Phobos: 0.31891,
  Deimos: 1.26244,
  Io: 1.769138,
  Europa: 3.551181,
  Ganymede: 7.154553,
  Callisto: 16.689018,
  Mimas: 0.942422,
  Enceladus: 1.370218,
  Tethys: 1.887802,
  Dione: 2.736915,
  Rhea: 4.5175,
  Titan: 15.945421,
  Iapetus: 79.3215,
  Miranda: 1.413479,
  Ariel: 2.520379,
  Umbriel: 4.144177,
  Titania: 8.705872,
  Oberon: 13.463239,
  Triton: -5.876854,
  Proteus: 1.122315,
};

const IO_EMISSIVE = new Color('#ff4400');
const SELECTED_EMISSIVE = new Color('#4488ff');
const BLACK = new Color('#000000');

const MoonMesh = memo(function MoonMesh({
  moon,
  planetName,
  planetData,
  sphereSegments,
}) {
  const { overrideSpeedFactor } = useSpeedControlActions();
  const { currentJulianDateRef } = useSimulationClock();
  const selectedPlanet = useSelectedPlanet();
  const setSelectedPlanet = useSelectedPlanetActions(); // Performance: splitted state and setter to prevent unnecessary re-renders
  const { setCameraState } = useCameraContext();
  const meshRef = useRef(null);
  const worldPositionRef = useRef(new Vector3());
  const initialPhase = useMemo(
    () => unitRandomFromString(`${planetName}:${moon.name}`, 31) * TWO_PI,
    [moon.name, planetName]
  );

  const texturePath = MOON_TEXTURE_PATHS[moon.name] || FALLBACK_TEXTURE;
  const texture = useLoader(TextureLoader, texturePath);
  const sphereArgs = useMemo(
    () => [moon.radius || 0.05, sphereSegments, sphereSegments],
    [moon.radius, sphereSegments]
  );

  const isSelected = selectedPlanet?.isMoon && selectedPlanet?.name === moon.name;
  const isIo = moon.name === 'Io';

  const handleClick = useCallback(
    (event) => {
      event.stopPropagation();
      const mesh = meshRef.current;
      if (!mesh) return;

      const worldPosition = mesh.getWorldPosition(worldPositionRef.current);
      const moonSelection = {
        ...moon,
        isMoon: true,
        parentPlanet: planetName,
        parentPlanetData: planetData,
        position: {
          x: worldPosition.x,
          y: worldPosition.y,
          z: worldPosition.z,
        },
      };

      setSelectedPlanet(moonSelection);
      overrideSpeedFactor();
      setCameraState('ZOOMING_IN');
    },
    [moon, overrideSpeedFactor, planetData, planetName, setCameraState, setSelectedPlanet]
  );

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const orbitalPeriod = MOON_ORBITAL_PERIOD_DAYS[moon.name] || 1;
    const elapsedDays = currentJulianDateRef.current - J2000_JULIAN_DATE;
    const angle = initialPhase + (elapsedDays / orbitalPeriod) * TWO_PI;
    const orbitRadius = moon.orbitRadius || 0.5;

    mesh.position.x = Math.cos(angle) * orbitRadius;
    mesh.position.z = Math.sin(angle) * orbitRadius;

    // Most major moons are synchronously rotating. Matching one spin to one
    // revolution gives the correct tidal-locking relationship at this scale.
    mesh.rotation.y = angle;
  });

  return (
    <mesh ref={meshRef} onClick={handleClick}>
      <sphereGeometry args={sphereArgs} />
      <meshStandardMaterial
        map={texture}
        roughness={0.9}
        metalness={0.1}
        emissive={isSelected ? SELECTED_EMISSIVE : isIo ? IO_EMISSIVE : BLACK}
        emissiveIntensity={isSelected ? 0.5 : isIo ? 0.3 : 0}
      />
    </mesh>
  );
});

function MoonOrbits({ moons }) {
  const orbitGeometries = useMemo(() => {
    const segments = 48;
    return moons.map((moon) => {
      const orbitRadius = moon.orbitRadius || 0.5;
      const positions = new Float32Array((segments + 1) * 3);

      for (let i = 0; i <= segments; i += 1) {
        const angle = (i / segments) * TWO_PI;
        positions[i * 3] = Math.cos(angle) * orbitRadius;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = Math.sin(angle) * orbitRadius;
      }

      return positions;
    });
  }, [moons]);

  return orbitGeometries.map((positions, index) => (
    <line key={`orbit-${moons[index].name}-${index}`} frustumCulled>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={moons[index].color || '#888888'}
        transparent
        opacity={0.1}
        depthWrite={false}
      />
    </line>
  ));
}

function Moons({
  planetPosition,
  moons,
  planetName,
  planetData,
  sphereSegments = 16,
}) {
  if (!moons?.length) return null;

  const safeSegments = Math.max(10, sphereSegments);

  return (
    <group position={planetPosition}>
      {moons.map((moon) => (
        <MoonMesh
          key={moon.name}
          moon={moon}
          planetName={planetName}
          planetData={planetData}
          sphereSegments={safeSegments}
        />
      ))}
      <MoonOrbits moons={moons} />
    </group>
  );
}

export default memo(Moons);
