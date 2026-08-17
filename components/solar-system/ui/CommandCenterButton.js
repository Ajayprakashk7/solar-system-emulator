'use client';

import React from 'react';
// import { useRouter } from 'next/navigation'; // Reserved for future navigation
import { motion, useAnimationControls } from 'framer-motion';
import { useCameraContext } from '../contexts/CameraContext';

const ExitButton = () => {
  // const router = useRouter(); // Reserved for future navigation feature
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
    window.location.href = 'http://www.orbital.ajayprakash.dev';
  };

  const exitButtonVariants = {
    hidden: { y: '120%', opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      className='fixed bottom-6 left-4 z-50 select-none'
      variants={exitButtonVariants}
      initial="hidden"
      animate={controls}
    >
      <motion.button
        onClick={handleExit}
        aria-label="Return to Command Center"
        className="bg-black/80 backdrop-blur-md rounded-full px-4 py-2 border border-blue-400/50 hover:border-blue-400/80 hover:bg-blue-500/10 transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center gap-2 text-white text-sm font-medium">
          <motion.span 
            className="text-blue-400 group-hover:text-blue-300 transition-colors duration-200"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            🏠
          </motion.span>
          <span className="text-white group-hover:text-blue-200 transition-colors duration-200">
            Command Center
          </span>
        </div>
      </motion.button>
    </motion.div>
  );
};

export default ExitButton;
