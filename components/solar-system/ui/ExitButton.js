'use client';

import React from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { useCameraContext } from '../contexts/CameraContext';

const ExitButton = () => {
  const { cameraState } = useCameraContext();
  const controls = useAnimationControls();

  // Animation controls based on camera state
  React.useEffect(() => {
    if (cameraState === 'FREE') {
      controls.start("visible");
    } else {
      controls.start("hidden");
    }
  }, [cameraState, controls]);

  const handleExit = () => {
    window.location.href = 'https://www.ajayprakash.dev';
  };

  const exitButtonVariants = {
    hidden: { x: '-120%', opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

  return (
    <motion.div
      className='fixed top-4 left-4 z-50 select-none
                 sm:top-6 sm:left-4
                 md:top-6 md:left-4'
      variants={exitButtonVariants}
      initial="hidden"
      animate={controls}
    >
      <motion.button
        onClick={handleExit}
        className="bg-black/80 backdrop-blur-md rounded-full 
                   px-3 py-2 text-xs
                   sm:px-4 sm:py-2 sm:text-sm
                   border border-red-400/50 hover:border-red-400/80 hover:bg-red-500/10 
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black
                   transition-all duration-300 group
                   min-h-[40px] min-w-[40px]
                   touch-manipulation"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center gap-1 sm:gap-2 text-white font-medium">
          <motion.span 
            className="text-red-400 group-hover:text-red-300 transition-colors duration-200 text-base"
            whileHover={{ rotate: -90 }}
            transition={{ duration: 0.3 }}
          >
            ←
          </motion.span>
          <span className="text-white group-hover:text-red-200 transition-colors duration-200 hidden sm:inline">
            Exit
          </span>
        </div>
      </motion.button>
    </motion.div>
  );
};

export default ExitButton;
