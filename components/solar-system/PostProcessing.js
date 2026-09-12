'use client';
import { useMemo } from 'react';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { getOptimalSettings } from './utils/performanceOptimizer';

export default function PostProcessing() {
  const settings = useMemo(() => getOptimalSettings(), []);

  // Post-processing is extremely heavy for mobile/low-end.
  // We only enable it for 'high' tier hardware.
  if (settings.tier !== 'high') {
    return null;
  }

  return (
    <EffectComposer disableNormalPass multisampling={settings.antialias ? 4 : 0}>
      <Bloom
        luminanceThreshold={0.5}
        luminanceSmoothing={0.9}
        intensity={1.0}
        mipmapBlur
      />
    </EffectComposer>
  );
}
