'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCameraContext } from '../contexts/CameraContext';
import { CloseIcon } from './SpaceIcons';

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

    const showTimeoutId = window.setTimeout(() => {
      setShowInstructions(true);
    }, 500);

    const hideTimeoutId = window.setTimeout(() => {
      setShowInstructions(false);
      try {
        window.localStorage.setItem(STORAGE_KEY, 'seen');
      } catch {
        // The hint still works when persistent storage is unavailable.
      }
    }, 7500);

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
      // Dismissal should always work even without storage.
    }
  };

  const isVisible = showInstructions && isTouchDevice && cameraState === 'FREE';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          className="fixed inset-x-3 z-[70] mx-auto max-w-sm sm:hidden"
          style={{ bottom: 'calc(4.9rem + env(safe-area-inset-bottom))' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          aria-label="Touch controls"
        >
          <div className="rounded-xl border border-white/10 bg-black/75 px-4 py-3 shadow-2xl shadow-black/30 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="space-kicker">Touch controls</p>
                <p className="mt-1 text-sm font-medium text-white/90">Explore naturally</p>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss touch controls hint"
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/55 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3 border-t border-white/10 pt-3 text-[11px] leading-snug text-white/55">
              <div>
                <span className="block font-medium text-white/85">Tap</span>
                Select a world
              </div>
              <div>
                <span className="block font-medium text-white/85">Drag</span>
                Orbit the scene
              </div>
              <div>
                <span className="block font-medium text-white/85">Pinch</span>
                Adjust distance
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default MobileInstructions;
