// PlanetMenu.js
'use client';
import React, { useEffect } from 'react';
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
    if (cameraState === 'FREE') {
      controls.start('visible');
    }
  }, [cameraState, controls]);

  const handleSelect = (planetName) => {
    const selected = planets.find((planet) => planet.name === planetName);
    if (!selected || selectedPlanet?.id === selected.id) return;

    setSelectedPlanet(selected);
    overrideSpeedFactor();
    setCameraState('ZOOMING_IN');
  };

  const menuVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  };

  return (
    <motion.div
      className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 z-50 pb-safe"
      initial="hidden"
      animate={controls}
      variants={menuVariants}
    >
      {/* Mobile: Horizontal scroll menu */}
      <div className="sm:hidden" role="navigation" aria-label="Planet selection menu">
        <div className="flex gap-2 overflow-x-auto overflow-y-hidden px-1 pb-2 snap-x snap-mandatory scroll-smooth scrollbar-hide max-w-full">
          {planets.map((planet) => (
            <button
              key={planet.id}
              onClick={() => handleSelect(planet.name)}
              disabled={selectedPlanet?.id === planet.id}
              aria-label={`View ${planet.name} details`}
              aria-pressed={selectedPlanet?.id === planet.id}
              className={`px-3 py-2 rounded-lg text-xs font-medium min-h-[36px] min-w-[64px] flex-shrink-0 snap-start transition-all duration-200 ${
                selectedPlanet?.id === planet.id
                  ? 'bg-purple-600 text-white opacity-50 cursor-not-allowed'
                  : 'bg-purple-500/20 text-purple-200 hover:bg-purple-500/40 hover:text-white'
              }`}
            >
              {planet.name}
            </button>
          ))}
        </div>
        {/* Swipe prompt */}
        <motion.div
          className="text-white/40 text-xs text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          ← Swipe to explore →
        </motion.div>
      </div>

      {/* Desktop: Grid-style menu */}
      <div className="hidden sm:flex flex-wrap justify-center gap-3" role="navigation" aria-label="Planet selection menu">
        {planets.map((planet) => (
          <button
            key={planet.id}
            onClick={() => handleSelect(planet.name)}
            disabled={selectedPlanet?.id === planet.id}
            aria-label={`View ${planet.name} details`}
            aria-pressed={selectedPlanet?.id === planet.id}
            className={`px-4 py-2 rounded-lg text-sm font-medium min-w-[80px] min-h-[40px] transition-all duration-200 ${
              selectedPlanet?.id === planet.id
                ? 'bg-purple-600 text-white opacity-50 cursor-not-allowed'
                : 'bg-purple-500/20 text-purple-200 hover:bg-purple-500/40 hover:text-white'
            }`}
          >
            {planet.name}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default PlanetMenu;
