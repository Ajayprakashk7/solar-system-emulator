// PlanetMenu.js
'use client';

import { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useSpeedControl } from '../contexts/SpeedControlContext';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';

const PlanetMenu = ({ planets }) => {
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { overrideSpeedFactor } = useSpeedControl();
  const { cameraState, setCameraState } = useCameraContext();
  const controls = useAnimation();

  useEffect(() => {
    controls.start(cameraState === 'FREE' ? 'visible' : 'hidden');
  }, [cameraState, controls]);

  const handleSelect = (planet) => {
    if (!planet || selectedPlanet?.id === planet.id) return;

    setSelectedPlanet(planet);
    overrideSpeedFactor();
    setCameraState('ZOOMING_IN');
  };

  const menuVariants = {
    hidden: { y: '125%', opacity: 0, pointerEvents: 'none' },
    visible: {
      y: 0,
      opacity: 1,
      pointerEvents: 'auto',
      transition: { type: 'spring', stiffness: 110, damping: 17 },
    },
  };

  return (
    <motion.nav
      aria-label="Explore the Solar System"
      className="fixed left-2 right-2 z-50 sm:left-4 sm:right-4"
      style={{ bottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      initial="hidden"
      animate={controls}
      variants={menuVariants}
    >
      <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-black/70 p-2 shadow-2xl shadow-black/30 backdrop-blur-md sm:p-2.5">
        <div className="scrollbar-hide flex max-w-full snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain sm:justify-center sm:gap-2">
          {planets.map((planet, index) => {
            const isSelected = selectedPlanet?.id === planet.id;

            return (
              <button
                key={planet.id}
                type="button"
                onClick={() => handleSelect(planet)}
                disabled={isSelected}
                aria-label={`Explore ${planet.name}${index <= 8 ? `, keyboard shortcut ${index}` : ''}`}
                aria-pressed={isSelected}
                className={`min-h-11 min-w-[4.5rem] flex-shrink-0 snap-start rounded-xl px-3 py-2 text-xs font-medium transition-colors duration-200 touch-manipulation sm:min-w-[4.75rem] sm:text-sm
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black
                  ${
                    isSelected
                      ? 'cursor-default bg-purple-600 text-white'
                      : 'bg-white/5 text-purple-100 hover:bg-purple-500/30 hover:text-white active:bg-purple-500/40'
                  }`}
              >
                {planet.name}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-center text-[10px] text-white/45 sm:hidden" aria-hidden="true">
          Swipe to explore worlds
        </p>
      </div>
    </motion.nav>
  );
};

export default PlanetMenu;
