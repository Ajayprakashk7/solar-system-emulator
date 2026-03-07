// Moons.js - Realistic moon rendering with orbital mechanics and interactivity
'use client';
import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import { useSpeedControl } from '../contexts/SpeedControlContext';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import * as THREE from 'three';
import { renderLogger } from '../../../lib/logger';

import React from 'react';

const MoonsComponent = ({ planetPosition, moons, planetName, planetData, adaptiveDetail = true }) => {
  const { speedFactor, overrideSpeedFactor } = useSpeedControl();
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { setCameraState } = useCameraContext();
  const [hoveredMoon, setHoveredMoon] = useState(null);
  const moonRefs = useRef([]);

  // Texture mapping for realistic moon surfaces
  // Primary textures: Dedicated moon texture files
  // Fallback textures: Scientifically plausible placeholders from similar celestial bodies
  const moonTextureMap = useMemo(() => ({
    // Earth's Moon (reference texture)
    'Moon': '/images/bodies/moon_2k.webp',
    
    // Mars Moons (use Mercury - similar rocky, heavily cratered surfaces)
    'Phobos': '/images/bodies/mercury_2k.webp',  // Fallback: Dark, heavily cratered
    'Deimos': '/images/bodies/mercury_2k.webp',  // Fallback: Similar to Phobos
    
    // Jupiter's Galilean Moons (dedicated textures)
    'Io': '/images/moons/io_2k.webp',
    'Europa': '/images/moons/europa_2k.webp',
    'Ganymede': '/images/moons/ganymede_2k.webp',
    'Callisto': '/images/moons/callisto_2k.webp',
    
    // Saturn's Moons
    'Mimas': '/images/moons/mimas_1k.webp',
    'Enceladus': '/images/moons/enceladus_1k.webp',
    'Tethys': '/images/bodies/moon_2k.webp',     // Fallback: Icy, cratered (similar to Moon)
    'Dione': '/images/bodies/moon_2k.webp',      // Fallback: Icy, wispy terrain
    'Rhea': '/images/moons/rhea_1k.webp',
    'Titan': '/images/moons/titan_2k.webp',
    'Iapetus': '/images/bodies/mercury_2k.webp', // Fallback: Two-toned, use darker Mercury
    
    // Uranus's Moons (use Moon - rocky/icy composition)
    'Miranda': '/images/bodies/moon_2k.webp',    // Fallback: Extreme terrain, cratered
    'Ariel': '/images/bodies/moon_2k.webp',      // Fallback: Icy, valleys
    'Umbriel': '/images/bodies/mercury_2k.webp', // Fallback: Dark surface, use Mercury
    'Titania': '/images/bodies/moon_2k.webp',    // Fallback: Icy, cratered
    'Oberon': '/images/bodies/moon_2k.webp',     // Fallback: Heavily cratered, icy
    
    // Neptune's Moons
    'Triton': '/images/moons/triton_1k.webp',
    'Proteus': '/images/bodies/mercury_2k.webp', // Fallback: Irregular, dark
  }), []);

  // Load textures for moons that have texture files
  const textures = useMemo(() => {
    const textureLoader = new THREE.TextureLoader();
    const loadedTextures = {};
    
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

  // Debug: Log when moons are rendered
  useEffect(() => {
    if (moons && moons.length > 0) {
      renderLogger.debug(`Rendering ${moons.length} moons:`, moons.map(m => m.name).join(', '));
    }
  }, [moons]);

  // Adaptive geometry detail based on device capabilities
  const geometryDetail = useMemo(() => {
    if (!adaptiveDetail) return 32;
    // Lower detail for mobile devices
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    return isMobile ? 16 : 32;
  }, [adaptiveDetail]);

  // Initialize moon orbital progress
  const moonOrbits = useRef(moons.map(() => Math.random() * Math.PI * 2));

  useFrame((state, delta) => {
    moons.forEach((moon, index) => {
      if (moonRefs.current[index]) {
        // Update orbital progress
        const orbitSpeed = moon.orbitSpeed || 0.5;
        moonOrbits.current[index] += orbitSpeed * delta * speedFactor;

        // Calculate position relative to parent planet
        const angle = moonOrbits.current[index];
        const orbitRadius = moon.orbitRadius || 0.5;
        
        const x = Math.cos(angle) * orbitRadius;
        const z = Math.sin(angle) * orbitRadius;
        
        moonRefs.current[index].position.set(x, 0, z);
        
        // Moon self-rotation (tidally locked moons rotate once per orbit)
        moonRefs.current[index].rotation.y = angle;
      }
    });
  });

  if (!moons || moons.length === 0) return null;

  // Handle moon click to select it
  const handleMoonClick = (moon, moonIndex, event) => {
    event.stopPropagation();
    
    // Get the moon's world position by combining planet position with moon's local position
    const moonRef = moonRefs.current[moonIndex];
    let moonWorldPosition = {
      x: planetPosition[0],
      y: planetPosition[1],
      z: planetPosition[2]
    };
    
    if (moonRef) {
      // Add moon's local offset to planet's position
      moonWorldPosition = {
        x: planetPosition[0] + moonRef.position.x,
        y: planetPosition[1] + moonRef.position.y,
        z: planetPosition[2] + moonRef.position.z
      };
    }
    
    // Create moon selection object with parent planet info
    const moonSelection = {
      ...moon,
      isMoon: true,
      parentPlanet: planetName,
      parentPlanetData: planetData,
      // Position info for camera targeting
      position: moonWorldPosition
    };
    
    setSelectedPlanet(moonSelection);
    overrideSpeedFactor();
    setCameraState('ZOOMING_IN');
  };

  // Handle moon hover
  const handleMoonPointerOver = (moonName) => {
    setHoveredMoon(moonName);
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'pointer';
    }
  };

  const handleMoonPointerOut = () => {
    setHoveredMoon(null);
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'auto';
    }
  };

  // Check if a moon is selected
  const isSelectedMoon = (moonName) => {
    return selectedPlanet?.isMoon && selectedPlanet?.name === moonName;
  };

  return (
    <group position={planetPosition}>
      {moons.map((moon, index) => {
        const moonArgs = [moon.radius || 0.05, geometryDetail, geometryDetail];
        const hasTexture = textures[moon.name];
        const isSelected = isSelectedMoon(moon.name);
        const isHovered = hoveredMoon === moon.name;
        
        return (
          <mesh
            key={`${moon.name}-${index}`}
            ref={(el) => (moonRefs.current[index] = el)}
            castShadow
            receiveShadow
            onClick={(e) => handleMoonClick(moon, index, e)}
            onPointerOver={() => handleMoonPointerOver(moon.name)}
            onPointerOut={handleMoonPointerOut}
          >
            <Sphere args={moonArgs}>
              {hasTexture ? (
                <meshStandardMaterial
                  map={hasTexture}
                  roughness={0.9}
                  metalness={0.1}
                  emissive={moon.name === 'Io' ? '#ff4400' : (isSelected ? '#4488ff' : '#000000')}
                  emissiveIntensity={moon.name === 'Io' ? 0.3 : (isSelected ? 0.5 : 0)}
                />
              ) : (
                <meshStandardMaterial
                  color={moon.color || '#888888'}
                  roughness={0.9}
                  metalness={0.1}
                  emissive={moon.name === 'Io' ? '#ff4400' : (isSelected ? '#4488ff' : '#000000')}
                  emissiveIntensity={moon.name === 'Io' ? 0.3 : (isSelected ? 0.5 : 0)}
                />
              )}
            </Sphere>

            {/* Selection highlight - glowing outline */}
            {(isSelected || isHovered) && (
              <mesh>
                <Sphere args={[moon.radius * 1.15, 16, 16]}>
                  <meshBasicMaterial
                    color={isSelected ? '#4488ff' : '#88aaff'}
                    transparent
                    opacity={isSelected ? 0.3 : 0.15}
                    depthWrite={false}
                  />
                </Sphere>
              </mesh>
            )}

            {/* Special effects for notable moons */}
            {moon.name === 'Europa' && (
              // Subtle ice glow for Europa
              <mesh>
                <Sphere args={[moon.radius * 1.05, 16, 16]}>
                  <meshBasicMaterial
                    color="#aaddff"
                    transparent
                    opacity={0.15}
                    depthWrite={false}
                  />
                </Sphere>
              </mesh>
            )}

            {moon.name === 'Titan' && (
              // Thick atmosphere for Titan
              <mesh>
                <Sphere args={[moon.radius * 1.08, 16, 16]}>
                  <meshPhysicalMaterial
                    color="#ffcc88"
                    transparent
                    opacity={0.25}
                    roughness={0.3}
                    clearcoat={0.5}
                    transmission={0.3}
                    depthWrite={false}
                  />
                </Sphere>
              </mesh>
            )}

            {moon.name === 'Enceladus' && (
              // Ice geysers glow for Enceladus
              <pointLight
                position={[0, moon.radius, 0]}
                intensity={0.2}
                distance={moon.radius * 3}
                color="#ffffff"
              />
            )}
          </mesh>
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
                count={segments + 1}
                array={new Float32Array(
                  Array.from({ length: segments + 1 }, (_, i) => {
                    const angle = (i / segments) * Math.PI * 2;
                    return [
                      Math.cos(angle) * orbitRadius,
                      0,
                      Math.sin(angle) * orbitRadius
                    ];
                  }).flat()
                )}
                itemSize={3}
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
};

export default React.memo(MoonsComponent);
