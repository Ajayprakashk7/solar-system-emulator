'use client';

import { useEffect } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { useCameraState } from '../contexts/CameraContext';
import { ArrowLeftIcon } from './SpaceIcons';

const ExitButton = () => {
  const { cameraState } = useCameraState();
  const controls = useAnimationControls();

  useEffect(() => {
    controls.start(cameraState === 'FREE' ? 'visible' : 'hidden');
  }, [cameraState, controls]);

  const exitButtonVariants = {
    hidden: { x: '-120%', opacity: 0, pointerEvents: 'none' },
    visible: { x: 0, opacity: 1, pointerEvents: 'auto' },
  };

  return (
    <motion.div
      className="fixed z-50 select-none"
      style={{
        top: 'max(1rem, env(safe-area-inset-top))',
        left: 'max(1rem, env(safe-area-inset-left))',
      }}
      variants={exitButtonVariants}
      initial="hidden"
      animate={controls}
    >
      <motion.a
        href="https://www.ajayprakash.dev"
        aria-label="Exit the Solar System Emulator and visit Ajay Prakash's website"
        title="Visit Ajay Prakash"
        className="space-control touch-manipulation"
        whileHover={{ x: -1 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="space-control-icon">
          <ArrowLeftIcon className="h-4 w-4" />
        </span>
        <span className="hidden sm:inline">Portfolio</span>
      </motion.a>
    </motion.div>
  );
};

export default ExitButton;
