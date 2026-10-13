'use client';

import { useFrame } from '@react-three/fiber';
import { useSimulationClock } from '../contexts/SimulationClockContext';
import { useSpeedControl } from '../contexts/SpeedControlContext';
import { SIMULATION_DAYS_PER_SECOND } from '../lib/orbitalMechanics';

export default function SimulationClock() {
  const { currentJulianDateRef } = useSimulationClock();
  const { speedFactorRef } = useSpeedControl();

  // Run before bodies so every planet and moon reads the same simulation time
  // for the current frame. Clamp long deltas after background-tab throttling so
  // returning to the tab never produces a visible orbital jump.
  useFrame((_, delta) => {
    const safeDelta = Math.min(Math.max(delta, 0), 0.1);
    currentJulianDateRef.current +=
      safeDelta * SIMULATION_DAYS_PER_SECOND * speedFactorRef.current;
  }, -100);

  return null;
}
