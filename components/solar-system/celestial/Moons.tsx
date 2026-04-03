// Moons.tsx - Realistic moon rendering with orbital mechanics and interactivity
'use client';
import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Detailed } from '@react-three/drei';
import { useSpeedControl } from '../contexts/SpeedControlContext';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import * as THREE from 'three';
import { renderLogger } from '../../../lib/logger';
import { MoonData, PlanetData } from '../types';

interface MoonsProps {
  planetPosition: [number, number, number];
  moons: MoonData[];
  planetName: string;
  planetData: PlanetData;
  adaptiveDetail?: boolean;
}

export default function Moons({ planetPosition, moons, planetName, planetData }: MoonsProps) {
  const { speedFactor, overrideSpeedFactor } = useSpeedControl() as { speedFactor: number, overrideSpeedFactor: () => void };
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet() as [unknown, (selection: unknown) => void];
  const { setCameraState } = useCameraContext() as { setCameraState: (state: string) => void };
  const [hoveredMoon, setHoveredMoon] = useState<string | null>(null);
  const moonRefs = useRef<Array<THREE.Group | null>>([]);
  const moonOrbits = useRef<number[]>(moons.map(() => Math.random() * Math.PI * 2));

  // Texture mapping for realistic moon surfaces
  const moonTextureMap = useMemo(() => ({
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
  } as Record<string, string>), []);

  const textures = useMemo(() => {
    const textureLoader = new THREE.TextureLoader();
    const loadedTextures: Record<string, THREE.Texture> = {};

    moons.forEach(moon => {
      if (moonTextureMap[moon.name]) {
        try {
          loadedTextures[moon.name] = textureLoader.load(moonTextureMap[moon.name]);
        } catch (error) {
          renderLogger.warn(`Failed to load texture for ${moon.name}:`, error);
        }
      }
    });

    return loadedTextures;
  }, [moons, moonTextureMap]);

  useEffect(() => {
    if (moons && moons.length > 0) {
      renderLogger.debug(`Rendering ${moons.length} moons:`, moons.map(m => m.name).join(', '));
    }
  }, [moons]);

  // Shared Geometries for LOD
  const { geometryHigh, geometryMedium, geometryLow } = useMemo(() => {
    return {
      geometryHigh: new THREE.SphereGeometry(1, 32, 32),
      geometryMedium: new THREE.SphereGeometry(1, 16, 16),
      geometryLow: new THREE.SphereGeometry(1, 8, 8)
    };
  }, []);

  // Cleanup shared geometries
  useEffect(() => {
    return () => {
      geometryHigh.dispose();
      geometryMedium.dispose();
      geometryLow.dispose();
    };
  }, [geometryHigh, geometryMedium, geometryLow]);

  // Handle moon click to select it
  const handleMoonClick = useCallback((moon: MoonData, moonIndex: number, event: unknown) => {
    const e = event as { stopPropagation?: () => void };
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    const moonRef = moonRefs.current[moonIndex];
    let moonWorldPosition = {
      x: planetPosition[0],
      y: planetPosition[1],
      z: planetPosition[2]
    };

    if (moonRef) {
      moonWorldPosition = {
        x: planetPosition[0] + moonRef.position.x,
        y: planetPosition[1] + moonRef.position.y,
        z: planetPosition[2] + moonRef.position.z
      };
    }

    const moonSelection = {
      ...moon,
      isMoon: true,
      parentPlanet: planetName,
      parentPlanetData: planetData,
      position: moonWorldPosition
    };

    if (setSelectedPlanet) {
      setSelectedPlanet(moonSelection);
    }
    overrideSpeedFactor();
    setCameraState('ZOOMING_IN');
  }, [planetPosition, planetName, planetData, setSelectedPlanet, overrideSpeedFactor, setCameraState]);

  const handleMoonPointerOver = useCallback((moonName: string) => {
    setHoveredMoon(moonName);
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'pointer';
    }
  }, []);

  const handleMoonPointerOut = useCallback(() => {
    setHoveredMoon(null);
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'auto';
    }
  }, []);

  const isSelectedMoon = useCallback((moonName: string) => {
    const sp = selectedPlanet as { isMoon?: boolean; name?: string } | null;
    return sp?.isMoon && sp?.name === moonName;
  }, [selectedPlanet]);

  useFrame((state, delta) => {
    moons.forEach((moon, index) => {
      if (moonRefs.current[index]) {
        const orbitSpeed = moon.orbitSpeed || 0.5;
        moonOrbits.current[index] += orbitSpeed * delta * speedFactor;

        const angle = moonOrbits.current[index];
        const orbitRadius = moon.orbitRadius || 0.5;

        const x = Math.cos(angle) * orbitRadius;
        const z = Math.sin(angle) * orbitRadius;

        moonRefs.current[index]!.position.set(x, 0, z);
        moonRefs.current[index]!.rotation.y = angle;
      }
    });
  });

  if (!moons || moons.length === 0) return null;

  return (
    <group position={planetPosition}>
      {moons.map((moon, index) => {
        const radius = moon.radius || 0.05;
        const hasTexture = textures[moon.name];
        const isSelected = isSelectedMoon(moon.name);
        const isHovered = hoveredMoon === moon.name;

        const emissiveColor = moon.name === 'Io' ? new THREE.Color('#ff4400') : (isSelected ? new THREE.Color('#4488ff') : new THREE.Color('#000000'));
        const emissiveIntensity = moon.name === 'Io' ? 0.3 : (isSelected ? 0.5 : 0);

        return (
          <group
            key={`${moon.name}-${index}`}
            ref={(el) => { moonRefs.current[index] = el; }}
          >
            <Detailed
              distances={[0, 50, 100]}
              onClick={(e) => handleMoonClick(moon, index, e)}
              onPointerOver={() => handleMoonPointerOver(moon.name)}
              onPointerOut={handleMoonPointerOut}
            >
              <mesh geometry={geometryHigh} scale={radius} castShadow receiveShadow>
                {hasTexture ? (
                   <meshStandardMaterial
                     map={hasTexture}
                     roughness={0.9}
                     metalness={0.1}
                     emissive={emissiveColor}
                     emissiveIntensity={emissiveIntensity}
                   />
                ) : (
                  <meshStandardMaterial
                     color={moon.color || '#888888'}
                     roughness={0.9}
                     metalness={0.1}
                     emissive={emissiveColor}
                     emissiveIntensity={emissiveIntensity}
                  />
                )}
              </mesh>
              <mesh geometry={geometryMedium} scale={radius} castShadow receiveShadow>
                {hasTexture ? (
                   <meshStandardMaterial
                     map={hasTexture}
                     roughness={0.9}
                     metalness={0.1}
                     emissive={emissiveColor}
                     emissiveIntensity={emissiveIntensity}
                   />
                ) : (
                  <meshStandardMaterial
                     color={moon.color || '#888888'}
                     roughness={0.9}
                     metalness={0.1}
                     emissive={emissiveColor}
                     emissiveIntensity={emissiveIntensity}
                  />
                )}
              </mesh>
              <mesh geometry={geometryLow} scale={radius} castShadow receiveShadow>
                {hasTexture ? (
                   <meshStandardMaterial
                     map={hasTexture}
                     roughness={0.9}
                     metalness={0.1}
                     emissive={emissiveColor}
                     emissiveIntensity={emissiveIntensity}
                   />
                ) : (
                  <meshStandardMaterial
                     color={moon.color || '#888888'}
                     roughness={0.9}
                     metalness={0.1}
                     emissive={emissiveColor}
                     emissiveIntensity={emissiveIntensity}
                  />
                )}
              </mesh>
            </Detailed>

            {/* Selection highlight - glowing outline */}
            {(isSelected || isHovered) && (
              <mesh>
                <sphereGeometry args={[radius * 1.15, 16, 16]} />
                <meshBasicMaterial
                  color={isSelected ? '#4488ff' : '#88aaff'}
                  transparent
                  opacity={isSelected ? 0.3 : 0.15}
                  depthWrite={false}
                />
              </mesh>
            )}

            {/* Special effects for notable moons */}
            {moon.name === 'Europa' && (
              <mesh>
                <sphereGeometry args={[radius * 1.05, 16, 16]} />
                <meshBasicMaterial
                  color="#aaddff"
                  transparent
                  opacity={0.15}
                  depthWrite={false}
                />
              </mesh>
            )}

            {moon.name === 'Titan' && (
              <mesh>
                <sphereGeometry args={[radius * 1.08, 16, 16]} />
                <meshPhysicalMaterial
                  color="#ffcc88"
                  transparent
                  opacity={0.25}
                  roughness={0.3}
                  clearcoat={0.5}
                  transmission={0.3}
                  depthWrite={false}
                />
              </mesh>
            )}

            {moon.name === 'Enceladus' && (
              <pointLight
                position={[0, radius, 0]}
                intensity={0.2}
                distance={radius * 3}
                color="#ffffff"
              />
            )}
          </group>
        );
      })}

      {/* Orbital paths (optional, subtle guides) */}
      {moons.map((moon, index) => {
        const orbitRadius = moon.orbitRadius || 0.5;
        const segments = 64;

        return (
          <line key={`orbit-${moon.name}-${index}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[
                  new Float32Array(
                    Array.from({ length: segments + 1 }, (_, i) => {
                      const angle = (i / segments) * Math.PI * 2;
                      return [
                        Math.cos(angle) * orbitRadius,
                        0,
                        Math.sin(angle) * orbitRadius
                      ];
                    }).flat()
                  ),
                  3
                ]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={moon.color || '#888888'}
              transparent
              opacity={0.1}
              depthWrite={false}
            />
          </line>
        );
      })}
    </group>
  );
}
