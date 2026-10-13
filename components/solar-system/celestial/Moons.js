// Moons.js - optimized moon rendering with correct world-space selection
'use client';

import { memo, useCallback, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Color, TextureLoader, Vector3 } from 'three';
import { useSpeedControl } from '../contexts/SpeedControlContext';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';

const FALLBACK_TEXTURE = '/images/bodies/moon_2k.webp';

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

const IO_EMISSIVE = new Color('#ff4400');
const SELECTED_EMISSIVE = new Color('#4488ff');
const BLACK = new Color('#000000');

const MoonMesh = memo(function MoonMesh({ moon, planetName, planetData }) {
  const { speedFactor, overrideSpeedFactor } = useSpeedControl();
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { setCameraState } = useCameraContext();
  const meshRef = useRef(null);
  const orbitRef = useRef(Math.random() * Math.PI * 2);
  const worldPositionRef = useRef(new Vector3());

  const texturePath = MOON_TEXTURE_PATHS[moon.name] || FALLBACK_TEXTURE;
  const texture = useLoader(TextureLoader, texturePath);
  const sphereArgs = useMemo(() => [moon.radius || 0.05, 16, 16], [moon.radius]);

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

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const moonOrbitSpeed = moon.orbitSpeed || 0.5;
    orbitRef.current += moonOrbitSpeed * delta * speedFactor;

    const angle = orbitRef.current;
    const orbitRadius = moon.orbitRadius || 0.5;
    mesh.position.x = Math.cos(angle) * orbitRadius;
    mesh.position.z = Math.sin(angle) * orbitRadius;
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
        const angle = (i / segments) * Math.PI * 2;
        positions[i * 3] = Math.cos(angle) * orbitRadius;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = Math.sin(angle) * orbitRadius;
      }

      return positions;
    });
  }, [moons]);

  return orbitGeometries.map((positions, index) => (
    <line key={`orbit-${moons[index].name}-${index}`}>
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

function Moons({ planetPosition, moons, planetName, planetData }) {
  if (!moons?.length) return null;

  return (
    <group position={planetPosition}>
      {moons.map((moon) => (
        <MoonMesh
          key={moon.name}
          moon={moon}
          planetName={planetName}
          planetData={planetData}
        />
      ))}
      <MoonOrbits moons={moons} />
    </group>
  );
}

export default memo(Moons);
