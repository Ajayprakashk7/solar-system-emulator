// IntroText.js
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const IntroText = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [display, setDisplay] = useState(true);

  useEffect(() => {
    const fadeInTimeoutId = window.setTimeout(() => setIsVisible(true), 2300);
    const fadeOutTimeoutId = window.setTimeout(() => setIsVisible(false), 7000);
    const hideTimeoutId = window.setTimeout(() => setDisplay(false), 7900);

    return () => {
      window.clearTimeout(fadeInTimeoutId);
      window.clearTimeout(fadeOutTimeoutId);
      window.clearTimeout(hideTimeoutId);
    };
  }, []);

  if (!display) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center px-6 text-center"
      aria-hidden="true"
    >
      <motion.div
        initial={{ y: 8 }}
        animate={{ y: isVisible ? 0 : 8 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.26em] text-white/45 sm:text-xs">
          Interactive orbital atlas
        </p>
        <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-7xl lg:text-8xl">
          Solar System
        </h1>
        <div className="mx-auto mt-5 h-px w-14 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </motion.div>
    </motion.div>
  );
};

export default IntroText;
