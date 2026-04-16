// Moons.js - Optimized moon rendering with orbital mechanics
'use client';
import { useRef, useMemo, useCallback, memo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { useSpeedControl } from '../contexts/SpeedControlContext';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { TextureLoader, Color } from 'three';

// Default fallback texture for moons without dedicated textures
const FALLBACK_TEXTURE = '/images/bodies/moon_2k.webp';

// Static texture path lookup - no useMemo needed
const MOON_TEXTURE_PATHS = {
  'Moon': '/images/bodies/moon_2k.webp',
  'Phobos': '/images/bodies/mercury_2k.webp',
  'Deimos': '/images/bodies/mercury_2k.webp',
  'Io': '/images/moons/io_2k.webp',
  'Europa': '/images/moons/europa_2k.webp',
  'Ganymede': '/images/moons/ganymede_2k.webp',
  'Callisto': '/images/moons/callisto_2k.webp',
  'Mimas': '/images/moons/mimas_1k.webp',
  'Enceladus': '/images/moons/enceladus_1k.webp',
  'Tethys': '/images/bodies/moon_2k.webp',
  'Dione': '/images/bodies/moon_2k.webp',
  'Rhea': '/images/moons/rhea_1k.webp',
  'Titan': '/images/moons/titan_2k.webp',
  'Iapetus': '/images/bodies/mercury_2k.webp',
  'Miranda': '/images/bodies/moon_2k.webp',
  'Ariel': '/images/bodies/moon_2k.webp',
  'Umbriel': '/images/bodies/mercury_2k.webp',
  'Titania': '/images/bodies/moon_2k.webp',
  'Oberon': '/images/bodies/moon_2k.webp',
  'Triton': '/images/moons/triton_1k.webp',
  'Proteus': '/images/bodies/mercury_2k.webp',
};

// Pre-allocated colors
const IO_EMISSIVE = new Color('#ff4400');
const SELECTED_EMISSIVE = new Color('#4488ff');
const BLACK = new Color('#000000');

// Individual moon component - uses useLoader (R3F's proper texture loading with caching & Suspense)
const MoonMesh = memo(function MoonMesh({ moon, planetPosition, planetName, planetData }) {
  const { speedFactor, overrideSpeedFactor } = useSpeedControl();
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { setCameraState } = useCameraContext();
  const meshRef = useRef();
  const orbitRef = useRef(Math.random() * Math.PI * 2);

  // Use R3F's useLoader for proper texture caching and Suspense integration
  const texturePath = MOON_TEXTURE_PATHS[moon.name] || FALLBACK_TEXTURE;
  const texture = useLoader(TextureLoader, texturePath);

  // 16 segments is plenty for small moon meshes
  const sphereArgs = useMemo(() => [moon.radius || 0.05, 16, 16], [moon.radius]);

  const isSelected = selectedPlanet?.isMoon && selectedPlanet?.name === moon.name;
  const isIo = moon.name === 'Io';

  const handleClick = useCallback((event) => {
    event.stopPropagation();
    
    const ref = meshRef.current;
    const moonSelection = {
      ...moon,
      isMoon: true,
      parentPlanet: planetName,
      parentPlanetData: planetData,
      position: ref ? {
        x: planetPosition[0] + ref.position.x,
        y: planetPosition[1] + ref.position.y,
        z: planetPosition[2] + ref.position.z
      } : {
        x: planetPosition[0],
        y: planetPosition[1],
        z: planetPosition[2]
      }
    };
    
    setSelectedPlanet(moonSelection);
    overrideSpeedFactor();
    setCameraState('ZOOMING_IN');
  }, [moon, planetName, planetData, planetPosition, setSelectedPlanet, overrideSpeedFactor, setCameraState]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const orbitSpeed = moon.orbitSpeed || 0.5;
    orbitRef.current += orbitSpeed * delta * speedFactor;

    const angle = orbitRef.current;
    const orbitRadius = moon.orbitRadius || 0.5;
    
    meshRef.current.position.x = Math.cos(angle) * orbitRadius;
    meshRef.current.position.z = Math.sin(angle) * orbitRadius;
    // Tidal locking
    meshRef.current.rotation.y = angle;
  });

  return (
    <mesh
      ref={meshRef}
      onClick={handleClick}
    >
      <sphereGeometry args={sphereArgs} />
      <meshStandardMaterial
        map={texture}
        roughness={0.9}
        metalness={0.1}
        emissive={isIo ? IO_EMISSIVE : (isSelected ? SELECTED_EMISSIVE : BLACK)}
        emissiveIntensity={isIo ? 0.3 : (isSelected ? 0.5 : 0)}
      />
    </mesh>
  );
});

// Pre-compute orbit line geometry once per moon set
function MoonOrbits({ moons }) {
  const orbitGeometries = useMemo(() => {
    const SEGMENTS = 48; // Reduced from 64
    return moons.map((moon) => {
      const orbitRadius = moon.orbitRadius || 0.5;
      const positions = new Float32Array((SEGMENTS + 1) * 3);
      for (let i = 0; i <= SEGMENTS; i++) {
        const angle = (i / SEGMENTS) * Math.PI * 2;
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
  if (!moons || moons.length === 0) return null;

  return (
    <group position={planetPosition}>
      {moons.map((moon, index) => (
        <MoonMesh
          key={`${moon.name}-${index}`}
          moon={moon}
          index={index}
          planetPosition={planetPosition}
          planetName={planetName}
          planetData={planetData}
        />
      ))}
      <MoonOrbits moons={moons} />
    </group>
  );
}

export default memo(Moons);
