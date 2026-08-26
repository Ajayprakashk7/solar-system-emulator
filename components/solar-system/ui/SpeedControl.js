// SpeedControl.js
'use client';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useSpeedControl } from '../contexts/SpeedControlContext';
import { useCameraContext } from '../contexts/CameraContext';

// Speed presets for cycling - defined outside component to avoid recreation
const SPEED_PRESETS = [0, 1, 2, 5, 10];

const SpeedControl = () => {
  const controls = useAnimation();
  const { speedFactor, setSpeedFactor } = useSpeedControl();
  const { cameraState } = useCameraContext();
  const [isHovering, setIsHovering] = useState(false);
  const componentRef = useRef(null);

  useEffect(() => {
    if (cameraState === 'FREE') {
      controls.start("visible");
    } else {
      controls.start("hidden");
    }
  }, [cameraState, controls]);

  const speedControlVariants = {
    hidden: { x: '120%', opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 120, damping: 15 } }
  };

  // Define isDisabled first before using it in callbacks
  const isDisabled = cameraState === 'ZOOMING_IN' || cameraState === 'DETAIL_VIEW';

  const handleCycleSpeed = useCallback(() => {
    if (!isDisabled) {
      const currentIndex = SPEED_PRESETS.findIndex(speed => Math.abs(speedFactor - speed) < 0.1);
      const nextIndex = (currentIndex + 1) % SPEED_PRESETS.length;
      setSpeedFactor(SPEED_PRESETS[nextIndex]);
    }
  }, [isDisabled, speedFactor, setSpeedFactor]);

  const speedIcon = useMemo(() => {
    if (isDisabled) return '⟳';
    if (speedFactor === 0) return '⏸';
    if (speedFactor < 1) return '▶';
    if (speedFactor <= 2) return '⏩';
    return '🚀';
  }, [isDisabled, speedFactor]);

  const speedStatus = useMemo(() => {
    if (speedFactor === 0) return 'Paused';
    if (speedFactor < 0.5) return 'Ultra Slow';
    if (speedFactor < 1) return 'Slow';
    if (speedFactor === 1) return 'Normal';
    if (speedFactor <= 2) return 'Fast';
    if (speedFactor <= 5) return 'Very Fast';
    return 'Ludicrous Speed';
  }, [speedFactor]);

  return (
    <>
      <motion.div
        ref={componentRef}
        className='fixed z-50 select-none
                   bottom-24 right-4
                   sm:top-6 sm:bottom-auto sm:right-6'
        variants={speedControlVariants}
        initial="hidden"
        animate={controls}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Direct Speed Control Button */}
        <motion.div 
          role="button"
          tabIndex={isDisabled ? -1 : 0}
          aria-label={`Orbital speed control: ${speedStatus}`}
          aria-disabled={isDisabled}
          title={isDisabled ? 'Speed control locked during planet view' : `Click to cycle speed (Current: ${speedStatus})`}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
              e.preventDefault();
              handleCycleSpeed();
            }
          }}
          className={`bg-black/80 backdrop-blur-md rounded-full 
                     px-4 py-3 text-xs
                     sm:px-5 sm:py-3 sm:text-sm
                     border transition-all duration-300 cursor-pointer
                     min-h-[48px] min-w-[48px]
                     touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
            isDisabled 
              ? 'border-orange-400/50 bg-orange-500/10' 
              : isHovering 
                ? 'border-blue-400/70 bg-blue-500/10 shadow-lg shadow-blue-500/20' 
                : 'border-white/30 hover:border-white/50'
          }`}
          whileHover={{ scale: isDisabled ? 1 : 1.05 }}
          whileTap={{ scale: isDisabled ? 1 : 0.95 }}
          onClick={handleCycleSpeed}
        >
          <div className="flex items-center gap-1 sm:gap-2 text-white font-medium">
            <span className="text-base">{speedIcon}</span>
            <span className="font-mono min-w-[24px] sm:min-w-[32px] text-center text-xs sm:text-sm" title={speedStatus}>
              {speedFactor % 1 === 0 ? speedFactor.toFixed(0) : speedFactor.toFixed(1)}x
            </span>
            {isDisabled ? (
              <span className="text-orange-400 text-xs">🔒</span>
            ) : (
              <span className="text-white/60 text-xs hidden sm:inline">⟲</span>
            )}
          </div>
        </motion.div>
      </motion.div>

    </>
  );
};

export default SpeedControl;
