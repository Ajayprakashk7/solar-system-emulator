//PlanetPositionsContext.js
'use client';
import React, { createContext, useContext, useRef, useCallback } from 'react';

export const PlanetPositionsContext = createContext({
  planetPositionsRef: { current: {} },
  updatePlanetPosition: () => {},
});

export const PlanetPositionsProvider = ({ children }) => {
  const planetPositionsRef = useRef({});

  // Direct mutation of ref to avoid re-renders and array allocation per frame
  const updatePlanetPosition = useCallback((name, x, y, z) => {
    let pos = planetPositionsRef.current[name];
    if (!pos) {
      planetPositionsRef.current[name] = [x, y, z];
    } else {
      pos[0] = x;
      pos[1] = y;
      pos[2] = z;
    }
  }, []);

  return (
    <PlanetPositionsContext.Provider value={{ planetPositionsRef, updatePlanetPosition }}>
      {children}
    </PlanetPositionsContext.Provider>
  );
};

export const usePlanetPositions = () => useContext(PlanetPositionsContext);
