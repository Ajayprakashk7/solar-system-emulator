// ControlMenu.js
'use client';

import { useEffect } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControl } from '../contexts/SpeedControlContext';

const ControlMenu = () => {
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { cameraState, setCameraState } = useCameraContext();
  const { restoreSpeedFactor } = useSpeedControl();
  const controls = useAnimationControls();

  useEffect(() => {
    controls.start(cameraState === 'FREE' ? 'visible' : 'hidden');
  }, [cameraState, controls]);

  const handleGoHome = () => {
    setCameraState('MOVING_TO_HOME');
    setSelectedPlanet(null);
    restoreSpeedFactor();
  };

  if (cameraState === 'INTRO_ANIMATION') return null;

  const resetViewVariants = {
    hidden: { y: '-125%', opacity: 0, pointerEvents: 'none' },
    visible: { y: 0, opacity: 1, pointerEvents: 'auto' },
  };

  return (
    <>
      <motion.div
        className="fixed left-1/2 z-50 -translate-x-1/2 select-none"
        style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
        variants={resetViewVariants}
        initial="hidden"
        animate={controls}
      >
        <motion.button
          type="button"
          onClick={handleGoHome}
          aria-label="Reset camera to the Solar System overview"
          title="Reset view (H)"
          className="group min-h-11 min-w-11 touch-manipulation rounded-full border border-blue-400/50 bg-black/80 px-3 py-2 text-xs backdrop-blur-md transition-colors hover:border-blue-300/80 hover:bg-blue-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:px-4 sm:text-sm"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          <span className="flex items-center gap-1.5 font-medium text-white sm:gap-2">
            <span aria-hidden="true" className="text-base text-blue-400">
              🎯
            </span>
            <span className="hidden sm:inline">Overview</span>
          </span>
        </motion.button>
      </motion.div>

      {selectedPlanet && cameraState !== 'FREE' && (
        <motion.div
          className="fixed z-[60] select-none"
          style={{
            top: 'max(1rem, env(safe-area-inset-top))',
            right: 'max(1rem, env(safe-area-inset-right))',
          }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            type="button"
            onClick={handleGoHome}
            aria-label={`Close ${selectedPlanet.name} view and return to overview`}
            title="Back to overview (Esc)"
            className="group min-h-11 min-w-11 touch-manipulation rounded-full border border-red-400/50 bg-black/80 px-3 py-2 text-xs backdrop-blur-md transition-colors hover:border-red-300/80 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:px-4 sm:text-sm"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <span className="flex items-center gap-1.5 font-medium text-white sm:gap-2">
              <span aria-hidden="true" className="text-base text-red-400">
                ✕
              </span>
              <span className="hidden sm:inline">Overview</span>
            </span>
          </motion.button>
        </motion.div>
      )}
    </>
  );
};

export default ControlMenu;
