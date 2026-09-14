//PlanetPositionsContext.js
'use client';
import React, { createContext, useContext, useRef, useCallback } from 'react';

export const PlanetPositionsContext = createContext({
  planetPositionsRef: { current: {} },
  updatePlanetPosition: () => {},
});

export const PlanetPositionsProvider = ({ children }) => {
  const planetPositionsRef = useRef({});

  // Direct mutation of ref to avoid re-renders
  const updatePlanetPosition = useCallback((name, x, y, z) => {
    if (!planetPositionsRef.current[name]) {
      planetPositionsRef.current[name] = new Float32Array(3);
    }
    const arr = planetPositionsRef.current[name];
    arr[0] = x;
    arr[1] = y;
    arr[2] = z;
  }, []);

  return (
    <PlanetPositionsContext.Provider value={{ planetPositionsRef, updatePlanetPosition }}>
      {children}
    </PlanetPositionsContext.Provider>
  );
};

export const usePlanetPositions = () => useContext(PlanetPositionsContext);
