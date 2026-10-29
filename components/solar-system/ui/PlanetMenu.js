// PlanetMenu.js
'use client';

import { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useSpeedControlActions } from '../contexts/SpeedControlContext';
import { useSelectedPlanetState, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
import { useCameraState, useCameraActions } from '../contexts/CameraContext';

const PlanetMenu = ({ planets }) => {
  const selectedPlanet = useSelectedPlanetState();
  const { setSelectedPlanet } = useSelectedPlanetActions();
  const { overrideSpeedFactor } = useSpeedControlActions();
  const { cameraState } = useCameraState();
  const { setCameraState } = useCameraActions();
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
    hidden: { y: '120%', opacity: 0, pointerEvents: 'none' },
    visible: {
      y: 0,
      opacity: 1,
      pointerEvents: 'auto',
      transition: { type: 'spring', stiffness: 120, damping: 20, mass: 0.8 },
    },
  };

  return (
    <motion.nav
      aria-label="Explore the Solar System"
      aria-describedby="planet-menu-hint"
      className="fixed inset-x-0 z-50 px-2 sm:px-5"
      style={{ bottom: 'max(0.8rem, env(safe-area-inset-bottom))' }}
      initial="hidden"
      animate={controls}
      variants={menuVariants}
    >
      <div className="mx-auto max-w-5xl">
        <div className="scrollbar-hide flex max-w-full snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain px-1 py-1 sm:justify-center sm:gap-2">
          {planets.map((planet, index) => {
            const isSelected = selectedPlanet?.id === planet.id;

            return (
              <button
                key={planet.id}
                type="button"
                onClick={() => handleSelect(planet)}
                disabled={isSelected}
                data-active={isSelected ? 'true' : 'false'}
                aria-label={`Explore ${planet.name}${index <= 8 ? `, keyboard shortcut ${index}` : ''}`}
                aria-pressed={isSelected}
                className="space-planet-chip touch-manipulation focus-visible:outline-none disabled:cursor-default"
              >
                {planet.name}
              </button>
            );
          })}
        </div>
      </div>
      <span id="planet-menu-hint" className="sr-only">
        On touch screens, swipe horizontally to reach every world.
      </span>
    </motion.nav>
  );
};

export default PlanetMenu;
