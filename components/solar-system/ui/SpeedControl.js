// SpeedControl.js
'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useSpeedControl } from '../contexts/SpeedControlContext';
import { useCameraState } from '../contexts/CameraContext';
import { SpeedIcon } from './SpaceIcons';

export const SPEED_PRESETS = [0, 0.5, 1, 2, 5];

const SpeedControl = () => {
  const controls = useAnimation();
  const { speedFactor, setSpeedFactor } = useSpeedControl();
  const { cameraState } = useCameraState();

  useEffect(() => {
    controls.start(cameraState === 'FREE' ? 'visible' : 'hidden');
  }, [cameraState, controls]);

  const isDisabled = cameraState === 'ZOOMING_IN' || cameraState === 'DETAIL_VIEW';

  const handleCycleSpeed = useCallback(() => {
    if (isDisabled) return;

    const currentIndex = SPEED_PRESETS.findIndex(
      (speed) => Math.abs(speedFactor - speed) < 0.1
    );
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % SPEED_PRESETS.length : 2;
    setSpeedFactor(SPEED_PRESETS[nextIndex]);
  }, [isDisabled, setSpeedFactor, speedFactor]);

  const speedStatus = useMemo(() => {
    if (speedFactor === 0) return 'Paused';
    if (speedFactor < 1) return 'Slow';
    if (speedFactor === 1) return 'Normal';
    if (speedFactor <= 2) return 'Fast';
    return 'Very fast';
  }, [speedFactor]);

  const visibleValue = speedFactor === 0
    ? 'Paused'
    : `${speedFactor % 1 === 0 ? speedFactor.toFixed(0) : speedFactor.toFixed(1)}×`;

  const speedControlVariants = {
    hidden: { x: '120%', opacity: 0, pointerEvents: 'none' },
    visible: {
      x: 0,
      opacity: 1,
      pointerEvents: 'auto',
      transition: { type: 'spring', stiffness: 115, damping: 17 },
    },
  };

  return (
    <motion.div
      className="fixed z-50 select-none top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))]"
      variants={speedControlVariants}
      initial="hidden"
      animate={controls}
    >
      <motion.button
        type="button"
        disabled={isDisabled}
        aria-label={`Orbital speed: ${speedStatus}. Activate to change speed.`}
        title={isDisabled ? 'Speed control is locked during planet view' : `Orbital speed: ${speedStatus}`}
        onClick={handleCycleSpeed}
        className="space-control touch-manipulation disabled:cursor-not-allowed disabled:opacity-55"
        whileHover={isDisabled ? undefined : { y: -1 }}
        whileTap={isDisabled ? undefined : { scale: 0.98 }}
      >
        <span className="space-control-icon">
          <SpeedIcon className="h-4 w-4" />
        </span>
        <span className="min-w-8 text-center font-mono text-[11px] tracking-tight text-white/90 sm:text-xs">
          {visibleValue}
        </span>
      </motion.button>
    </motion.div>
  );
};

export default SpeedControl;
