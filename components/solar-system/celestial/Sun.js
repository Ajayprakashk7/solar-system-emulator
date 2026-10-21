// Sun.js - adaptive interactive Sun driven by the shared simulation clock
'use client';

import { useCallback, useMemo, useRef } from 'react';
import { AdditiveBlending, Color, TextureLoader } from 'three';
import { useFrame, useLoader } from '@react-three/fiber';
import { useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControlActions } from '../contexts/SpeedControlContext';
import { useSimulationClock } from '../contexts/SimulationClockContext';
import { createGlowTexture } from '../utils/glowTexture';
import { getAxialRotationAngle } from '../lib/orbitalMechanics';
import planetsData from '../lib/planetsData';

const SUN_EMISSIVE = new Color(0xffaa44);
const SUN_COLOR = new Color(0xffff44);
const INNER_GLOW_COLOR = new Color(0xffa500);
const OUTER_GLOW_COLOR = new Color(0xff6600);
const CORONA_COLOR = new Color(0xffcc88);
const LIGHT_WARM = new Color(0xffee99);

export default function Sun({
  position,
  radius,
  sphereSegments = 32,
  shadows = false,
  shadowMapSize = 1024,
}) {
  const sunTexture = useLoader(TextureLoader, '/images/bodies/sun_2k.webp');
  const glowTexture = useMemo(() => createGlowTexture(256), []);
  const sunRef = useRef(null);
  const glowRef = useRef(null);
  const innerGlowRef = useRef(null);
  const outerGlowRef = useRef(null);

  const { setSelectedPlanet } = useSelectedPlanetActions();
  const { setCameraState } = useCameraContext();
  const { overrideSpeedFactor } = useSpeedControlActions();
  const { currentJulianDateRef } = useSimulationClock();

  const innerSegments = Math.max(12, Math.floor(sphereSegments * 0.75));
  const outerSegments = Math.max(10, Math.floor(sphereSegments * 0.5));
  const sunSphereArgs = useMemo(
    () => [radius, sphereSegments, sphereSegments],
    [radius, sphereSegments]
  );
  const innerGlowArgs = useMemo(
    () => [radius * 1.05, innerSegments, innerSegments],
    [innerSegments, radius]
  );
  const outerGlowArgs = useMemo(
    () => [radius * 1.15, outerSegments, outerSegments],
    [outerSegments, radius]
  );
  const glowScale = useMemo(() => [radius * 4, radius * 4, 1], [radius]);
  const sunData = useMemo(() => planetsData.find((planet) => planet.isSun), []);

  const handleSunClick = useCallback(() => {
    if (!sunData) return;

    setSelectedPlanet(sunData);
    overrideSpeedFactor();
    setCameraState('ZOOMING_IN');
  }, [overrideSpeedFactor, setCameraState, setSelectedPlanet, sunData]);

  useFrame((state) => {
    if (sunRef.current && Number.isFinite(sunData?.displayStats?.rotationPeriod)) {
      sunRef.current.rotation.y = getAxialRotationAngle(
        sunData.displayStats.rotationPeriod,
        currentJulianDateRef.current
      );
    }

    // The glow variation is an artistic representation of solar activity. It is
    // intentionally subtle and tied to real frame time rather than orbital time.
    const time = state.clock.elapsedTime;
    const sin08 = Math.sin(time * 0.8);

    if (glowRef.current) {
      glowRef.current.material.opacity = (0.7 + sin08 * 0.2) * 0.4;
    }
    if (innerGlowRef.current) {
      innerGlowRef.current.material.opacity = 0.15 + Math.sin(time * 1.2) * 0.05;
    }
    if (outerGlowRef.current) {
      outerGlowRef.current.material.opacity = 0.08 + Math.sin(time * 0.6) * 0.03;
    }
  });

  return (
    <group position={position} onClick={handleSunClick}>
      <mesh ref={sunRef}>
        <sphereGeometry args={sunSphereArgs} />
        <meshPhongMaterial
          map={sunTexture}
          emissiveMap={sunTexture}
          emissive={SUN_EMISSIVE}
          emissiveIntensity={1.2}
          color={SUN_COLOR}
          shininess={0}
        />
      </mesh>

      <mesh ref={innerGlowRef}>
        <sphereGeometry args={innerGlowArgs} />
        <meshBasicMaterial
          color={INNER_GLOW_COLOR}
          transparent
          opacity={0.15}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={outerGlowRef}>
        <sphereGeometry args={outerGlowArgs} />
        <meshBasicMaterial
          color={OUTER_GLOW_COLOR}
          transparent
          opacity={0.08}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <sprite ref={glowRef} scale={glowScale}>
        <spriteMaterial
          map={glowTexture}
          color={CORONA_COLOR}
          transparent
          opacity={0.4}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      <pointLight
        position={[0, 0, 0]}
        color={LIGHT_WARM}
        intensity={50}
        distance={1000}
        decay={2}
        castShadow={shadows}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-near={0.5}
        shadow-camera-far={500}
        shadow-bias={-0.0001}
      />
    </group>
  );
}
