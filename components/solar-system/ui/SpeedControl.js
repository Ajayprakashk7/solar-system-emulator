// SpeedControl.js
'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useSpeedControl } from '../contexts/SpeedControlContext';
import { useCameraContext } from '../contexts/CameraContext';

export const SPEED_PRESETS = [0, 0.5, 1, 2, 5];

const SpeedControl = () => {
  const controls = useAnimation();
  const { speedFactor, setSpeedFactor } = useSpeedControl();
  const { cameraState } = useCameraContext();

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

  const speedIcon = useMemo(() => {
    if (isDisabled) return '⟳';
    if (speedFactor === 0) return '⏸';
    if (speedFactor < 1) return '▶';
    if (speedFactor <= 2) return '⏩';
    return '🚀';
  }, [isDisabled, speedFactor]);

  const speedStatus = useMemo(() => {
    if (speedFactor === 0) return 'Paused';
    if (speedFactor < 1) return 'Slow';
    if (speedFactor === 1) return 'Normal';
    if (speedFactor <= 2) return 'Fast';
    return 'Very fast';
  }, [speedFactor]);

  const speedControlVariants = {
    hidden: { x: '120%', opacity: 0, pointerEvents: 'none' },
    visible: {
      x: 0,
      opacity: 1,
      pointerEvents: 'auto',
      transition: { type: 'spring', stiffness: 120, damping: 15 },
    },
  };

  return (
    <motion.div
      className="fixed z-50 select-none top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] sm:top-6 sm:right-6"
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
        className={`group min-h-11 min-w-11 touch-manipulation rounded-full border bg-black/80 px-4 py-2.5 text-xs backdrop-blur-md transition-colors duration-200 sm:px-5 sm:text-sm
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black
          disabled:cursor-not-allowed disabled:border-orange-400/50 disabled:bg-orange-500/10
          enabled:border-white/30 enabled:hover:border-blue-400/70 enabled:hover:bg-blue-500/10 enabled:hover:shadow-lg enabled:hover:shadow-blue-500/20`}
        whileHover={isDisabled ? undefined : { scale: 1.04 }}
        whileTap={isDisabled ? undefined : { scale: 0.96 }}
      >
        <span className="flex items-center gap-1.5 font-medium text-white sm:gap-2">
          <span aria-hidden="true" className="text-base">
            {speedIcon}
          </span>
          <span className="min-w-8 text-center font-mono text-xs sm:text-sm">
            {speedFactor % 1 === 0 ? speedFactor.toFixed(0) : speedFactor.toFixed(1)}x
          </span>
          {isDisabled ? (
            <span aria-hidden="true" className="text-xs text-orange-400">
              🔒
            </span>
          ) : (
            <span aria-hidden="true" className="hidden text-xs text-white/60 sm:inline">
              ⟲
            </span>
          )}
        </span>
      </motion.button>
    </motion.div>
  );
};

export default SpeedControl;
