'use client';

import { useEffect } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { useCameraContext } from '../contexts/CameraContext';

const ExitButton = () => {
  const { cameraState } = useCameraContext();
  const controls = useAnimationControls();

  useEffect(() => {
    controls.start(cameraState === 'FREE' ? 'visible' : 'hidden');
  }, [cameraState, controls]);

  const exitButtonVariants = {
    hidden: { x: '-125%', opacity: 0, pointerEvents: 'none' },
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
        title="Exit emulator"
        className="group flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-full border border-red-400/50 bg-black/80 px-3 py-2 text-xs text-white backdrop-blur-md transition-colors hover:border-red-300/80 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:px-4 sm:text-sm"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
      >
        <span aria-hidden="true" className="text-base text-red-400 transition-transform group-hover:-translate-x-0.5">
          ←
        </span>
        <span className="ml-2 hidden font-medium sm:inline">Exit</span>
      </motion.a>
    </motion.div>
  );
};

export default ExitButton;
