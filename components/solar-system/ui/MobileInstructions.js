'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCameraContext } from '../contexts/CameraContext';

const STORAGE_KEY = 'solar-system-mobile-instructions';
const COARSE_POINTER_QUERY = '(pointer: coarse)';

const getTouchCapabilitySnapshot = () => {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia(COARSE_POINTER_QUERY).matches ||
    navigator.maxTouchPoints > 0 ||
    'ontouchstart' in window
  );
};

const getTouchCapabilityServerSnapshot = () => false;

const subscribeToTouchCapability = (onStoreChange) => {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia(COARSE_POINTER_QUERY);
  mediaQuery.addEventListener('change', onStoreChange);
  return () => mediaQuery.removeEventListener('change', onStoreChange);
};

const MobileInstructions = () => {
  const [showInstructions, setShowInstructions] = useState(false);
  const isTouchDevice = useSyncExternalStore(
    subscribeToTouchCapability,
    getTouchCapabilitySnapshot,
    getTouchCapabilityServerSnapshot
  );
  const { cameraState } = useCameraContext();

  useEffect(() => {
    if (!isTouchDevice || cameraState !== 'FREE') return undefined;

    let hasSeenInstructions = false;
    try {
      hasSeenInstructions = window.localStorage.getItem(STORAGE_KEY) === 'seen';
    } catch {
      // Storage may be unavailable in privacy-restricted browsers.
    }

    if (hasSeenInstructions) return undefined;

    // Schedule state changes rather than synchronously cascading an update from
    // the effect body. The UI remains hidden until the current commit completes.
    const showTimeoutId = window.setTimeout(() => {
      setShowInstructions(true);
    }, 0);

    const hideTimeoutId = window.setTimeout(() => {
      setShowInstructions(false);
      try {
        window.localStorage.setItem(STORAGE_KEY, 'seen');
      } catch {
        // The modal still works when persistent storage is unavailable.
      }
    }, 6000);

    return () => {
      window.clearTimeout(showTimeoutId);
      window.clearTimeout(hideTimeoutId);
    };
  }, [cameraState, isTouchDevice]);

  const handleDismiss = () => {
    setShowInstructions(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, 'seen');
    } catch {
      // Ignore storage failures; dismissal should always work.
    }
  };

  const isVisible = showInstructions && isTouchDevice && cameraState === 'FREE';
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-controls-title"
      >
        <button
          type="button"
          className="absolute inset-0 cursor-default bg-black/65 backdrop-blur-sm"
          onClick={handleDismiss}
          aria-label="Close mobile controls help"
        />

        <motion.div
          className="relative w-full max-w-sm rounded-2xl border border-purple-300/25 bg-gradient-to-br from-purple-950/95 to-blue-950/95 p-5 shadow-2xl"
          initial={{ scale: 0.94, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.94, y: 16 }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 id="mobile-controls-title" className="text-lg font-bold text-white">
              Mobile controls
            </h3>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Close mobile controls help"
              className="flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-red-500/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>

          <div className="space-y-3 text-sm text-white/90">
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="text-base">👆</span>
              <div>
                <div className="font-medium">Tap a world</div>
                <div className="text-xs text-white/65">Fly to it and open its facts.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="text-base">↔️</span>
              <div>
                <div className="font-medium">Swipe the planet rail</div>
                <div className="text-xs text-white/65">Reach every planet on narrow screens.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="text-base">🌀</span>
              <div>
                <div className="font-medium">Drag and pinch the scene</div>
                <div className="text-xs text-white/65">Orbit the camera and zoom naturally.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="text-base">⏱️</span>
              <div>
                <div className="font-medium">Tap the speed control</div>
                <div className="text-xs text-white/65">Pause or change orbital speed.</div>
              </div>
            </div>
          </div>

          <p className="mt-4 border-t border-white/15 pt-3 text-center text-[11px] text-white/50">
            This guide only appears once.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MobileInstructions;
