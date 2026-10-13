// GuideRing.js - lightweight Keplerian orbital guide
'use client';

import { useMemo } from 'react';
import { useCameraContext } from '../contexts/CameraContext';
import { useSimulationClock } from '../contexts/SimulationClockContext';
import { createVisualOrbitPath } from '../lib/orbitalMechanics';

export default function GuideRing({ planetName, radius }) {
  const { cameraState } = useCameraContext();
  const { initialJulianDate } = useSimulationClock();

  const positions = useMemo(
    () => createVisualOrbitPath(planetName, radius, 128, initialJulianDate),
    [initialJulianDate, planetName, radius]
  );

  const isVisible =
    cameraState === 'FREE' ||
    cameraState === 'MOVING_TO_HOME' ||
    cameraState === 'INTRO_ANIMATION';

  if (positions.length === 0) return null;

  return (
    <line visible={isVisible} frustumCulled>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#6b8cff" transparent opacity={0.2} depthWrite={false} />
    </line>
  );
}
