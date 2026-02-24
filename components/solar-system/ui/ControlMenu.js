// ControlMenu.js
'use client';
import React, { useRef } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControl } from '../contexts/SpeedControlContext';

const ControlMenu = () => {
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { cameraState, setCameraState, isTouring, setIsTouring } = useCameraContext();
  const { restoreSpeedFactor } = useSpeedControl();
  const componentRef = useRef();
  
  // Animation controls
  const controls = useAnimationControls();

  // Animation controls based on camera state
  React.useEffect(() => {
    if (cameraState === 'FREE') {
      controls.start("visible");
    } else {
      controls.start("hidden");
    }
  }, [cameraState, controls]);

  const handleGoHome = () => {
    setCameraState('MOVING_TO_HOME');
    setSelectedPlanet(null);
    restoreSpeedFactor();
  };

  const handleExitView = () => {
    setCameraState('MOVING_TO_HOME');
    setSelectedPlanet(null);
    restoreSpeedFactor();
  };

  if (cameraState === 'INTRO_ANIMATION') {
    return null;
  }

  const resetViewVariants = {
    hidden: { y: '-120%', opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <>
      {/* Tour Button - Top Left */}
      <motion.div
        className='fixed top-4 left-4 z-50 select-none sm:top-6 sm:left-4'
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
         <motion.button
          onClick={() => setIsTouring(!isTouring)}
          aria-label={isTouring ? "Stop Tour" : "Start Tour"}
          title={isTouring ? "Stop Tour" : "Start Tour"}
          className={`backdrop-blur-md rounded-full
                     px-3 py-2 text-xs
                     sm:px-4 sm:py-2 sm:text-sm
                     border transition-all duration-300 group
                     min-h-[40px] min-w-[40px]
                     touch-manipulation
                     ${isTouring
                       ? 'bg-blue-500/20 border-blue-400 text-blue-100 hover:bg-blue-500/30'
                       : 'bg-black/80 border-blue-400/50 hover:border-blue-400/80 hover:bg-blue-500/10 text-white'}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="flex items-center gap-1 sm:gap-2 font-medium">
            <span className="text-blue-400 group-hover:text-blue-300 transition-colors duration-200 text-base">
              {isTouring ? '⏹' : '▶'}
            </span>
            <span className="hidden sm:inline">
              {isTouring ? 'Stop Tour' : 'Start Tour'}
            </span>
          </div>
        </motion.button>
      </motion.div>

      {/* Reset View Button - Top Center aligned with other controls */}
      <motion.div
        ref={componentRef}
        className='fixed top-4 left-1/2 transform -translate-x-1/2 z-50 select-none
                   sm:top-6 sm:left-1/2'
        variants={resetViewVariants}
        initial="hidden"
        animate={controls}
      >
        <motion.button
          onClick={handleGoHome}
          aria-label="Reset camera view to home position"
          title="Reset View"
          className="bg-black/80 backdrop-blur-md rounded-full 
                     px-3 py-2 text-xs
                     sm:px-4 sm:py-2 sm:text-sm
                     border border-blue-400/50 hover:border-blue-400/80 hover:bg-blue-500/10 
                     transition-all duration-300 group
                     min-h-[40px] min-w-[40px]
                     touch-manipulation"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="flex items-center gap-1 sm:gap-2 text-white font-medium">
            <span className="text-blue-400 group-hover:text-blue-300 transition-colors duration-200 text-base">
              🎯
            </span>
            <span className="text-white group-hover:text-blue-200 transition-colors duration-200 hidden sm:inline">
              Reset View
            </span>
          </div>
        </motion.button>
      </motion.div>

      {/* Exit View Button for Selected Planet - Better mobile positioning */}
      {selectedPlanet && (
        <motion.div
          className='fixed top-4 right-4 z-50 select-none
                     sm:top-6 sm:right-4'
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          <motion.button
            onClick={handleExitView}
            aria-label={`Exit ${selectedPlanet?.name || 'planet'} detail view`}
            title="Exit View"
            className="bg-black/80 backdrop-blur-md rounded-full 
                       px-3 py-2 text-xs
                       sm:px-4 sm:py-2 sm:text-sm
                       border border-red-400/50 hover:border-red-400/80 hover:bg-red-500/10 
                       transition-all duration-300 group
                       min-h-[40px] min-w-[40px]
                       touch-manipulation"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex items-center gap-1 sm:gap-2 text-white font-medium">
              <span className="text-red-400 group-hover:text-red-300 transition-colors duration-200 text-base">
                ✕
              </span>
              <span className="text-white group-hover:text-red-200 transition-colors duration-200 hidden sm:inline">
                Exit View
              </span>
            </div>
          </motion.button>
        </motion.div>
      )}
    </>
  );
};

export default ControlMenu;