//PlanetPositionsContext.js
'use client';
import React, { createContext, useContext, useRef, useCallback } from 'react';

export const PlanetPositionsContext = createContext({
  planetPositionsRef: { current: {} },
  updatePlanetPosition: () => {},
});

export const PlanetPositionsProvider = ({ children }) => {
  const planetPositionsRef = useRef({});

  // Direct mutation of ref to avoid re-renders. Avoid per-frame array allocations.
  const updatePlanetPosition = useCallback((name, x, y, z) => {
    if (!planetPositionsRef.current[name]) {
      planetPositionsRef.current[name] = new Float32Array(3);
    }
    const pos = planetPositionsRef.current[name];
    pos[0] = x;
    pos[1] = y;
    pos[2] = z;
  }, []);

  return (
    <PlanetPositionsContext.Provider value={{ planetPositionsRef, updatePlanetPosition }}>
      {children}
    </PlanetPositionsContext.Provider>
  );
};

export const usePlanetPositions = () => useContext(PlanetPositionsContext);
