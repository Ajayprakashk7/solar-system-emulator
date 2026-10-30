// ControlMenu.js
'use client';

import { useEffect } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
import { useCameraContext, useCameraActions } from '../contexts/CameraContext';
import { useSpeedControlActions } from '../contexts/SpeedControlContext';
import { ArrowLeftIcon, OverviewIcon } from './SpaceIcons';

const ControlMenu = () => {
  const selectedPlanet = useSelectedPlanet();
  const setSelectedPlanet = useSelectedPlanetActions();
  const cameraState = useCameraContext();
  const setCameraState = useCameraActions();
  const { restoreSpeedFactor } = useSpeedControlActions();
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
    hidden: { y: '-120%', opacity: 0, pointerEvents: 'none' },
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
          className="space-control touch-manipulation"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="space-control-icon">
            <OverviewIcon className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">Overview</span>
        </motion.button>
      </motion.div>

      {selectedPlanet && cameraState !== 'FREE' && (
        <motion.div
          className="fixed z-[60] select-none"
          style={{
            top: 'max(1rem, env(safe-area-inset-top))',
            right: 'max(1rem, env(safe-area-inset-right))',
          }}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ duration: 0.18 }}
        >
          <motion.button
            type="button"
            onClick={handleGoHome}
            aria-label={`Close ${selectedPlanet.name} and return to the Solar System overview`}
            title="Back to overview (Esc)"
            className="space-control touch-manipulation"
            whileHover={{ x: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="space-control-icon">
              <ArrowLeftIcon className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline">Back</span>
          </motion.button>
        </motion.div>
      )}
    </>
  );
};

export default ControlMenu;
