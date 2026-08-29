'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCameraContext } from '../contexts/CameraContext';

const MobileInstructions = () => {
  const [showInstructions, setShowInstructions] = useState(false);
  const { cameraState } = useCameraContext();

  useEffect(() => {
    // Show instructions on first load for mobile devices
    const hasSeenInstructions = localStorage.getItem('solar-system-mobile-instructions');
    const isMobile = 'ontouchstart' in window && window.innerWidth < 768;
    
    if (isMobile && !hasSeenInstructions && cameraState === 'FREE') {
      setShowInstructions(true);
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowInstructions(false);
        localStorage.setItem('solar-system-mobile-instructions', 'seen');
      }, 5000);
    }
  }, [cameraState]);

  const handleDismiss = () => {
    setShowInstructions(false);
    localStorage.setItem('solar-system-mobile-instructions', 'seen');
  };

  if (!showInstructions || !('ontouchstart' in window)) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleDismiss}
        />

        {/* Instructions Card */}
        <motion.div
          className="relative bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-xl 
                     border border-purple-400/30 rounded-2xl p-6 max-w-sm mx-auto"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              📱 Mobile Controls
            </h3>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss mobile instructions"
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-red-500/30 text-white/60 hover:text-red-300 transition-all duration-200 flex items-center justify-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-purple-900"
            >
              ✕
            </button>
          </div>

          {/* Instructions */}
          <div className="space-y-3 text-white/90 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-blue-400 text-base">👆</span>
              <div>
                <div className="font-medium">Tap planets</div>
                <div className="text-white/70 text-xs">Select and view details</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-green-400 text-base">👈👉</span>
              <div>
                <div className="font-medium">Swipe left/right</div>
                <div className="text-white/70 text-xs">Navigate between planets</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-yellow-400 text-base">🎯</span>
              <div>
                <div className="font-medium">Tap center button</div>
                <div className="text-white/70 text-xs">Reset to overview</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-red-400 text-base">⚡</span>
              <div>
                <div className="font-medium">Tap speed control</div>
                <div className="text-white/70 text-xs">Change animation speed</div>
              </div>
            </div>
          </div>

          {/* Auto-dismiss indicator */}
          <div className="mt-4 pt-3 border-t border-white/20 text-center">
            <div className="text-xs text-white/60">
              Auto-dismisses in 5 seconds
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MobileInstructions;
