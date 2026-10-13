// GuideRing.js - lightweight orbital guide ring
'use client';

import { useMemo } from 'react';
import { useCameraContext } from '../contexts/CameraContext';

export default function GuideRing({ radius }) {
  const { cameraState } = useCameraContext();
  const torusArgs = useMemo(() => [radius, 0.001, 4, 64], [radius]);
  const isVisible =
    cameraState === 'FREE' ||
    cameraState === 'MOVING_TO_HOME' ||
    cameraState === 'INTRO_ANIMATION';

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} visible={isVisible}>
      <torusGeometry args={torusArgs} />
      <meshBasicMaterial color="#4488ff" transparent opacity={0.24} depthWrite={false} />
    </mesh>
  );
}
