//PlanetPositionsContext.js
'use client';
import React, { createContext, useContext, useRef, useCallback } from 'react';

export const PlanetPositionsContext = createContext({
  planetPositionsRef: { current: {} },
  updatePlanetPosition: () => {},
});

export const PlanetPositionsProvider = ({ children }) => {
  const planetPositionsRef = useRef({});

  // Direct mutation of ref to avoid re-renders and inline array allocations
  const updatePlanetPosition = useCallback((name, x, y, z) => {
    if (!planetPositionsRef.current[name]) {
      planetPositionsRef.current[name] = [0, 0, 0];
    }
    planetPositionsRef.current[name][0] = x;
    planetPositionsRef.current[name][1] = y;
    planetPositionsRef.current[name][2] = z;
  }, []);

  return (
    <PlanetPositionsContext.Provider value={{ planetPositionsRef, updatePlanetPosition }}>
      {children}
    </PlanetPositionsContext.Provider>
  );
};

export const usePlanetPositions = () => useContext(PlanetPositionsContext);
