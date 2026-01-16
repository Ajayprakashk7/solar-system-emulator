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
  const updatePlanetPosition = useCallback((name, position) => {
    planetPositionsRef.current[name] = position;
  }, []);

  return (
    <PlanetPositionsContext.Provider value={{ planetPositionsRef, updatePlanetPosition }}>
      {children}
    </PlanetPositionsContext.Provider>
  );
};

export const usePlanetPositions = () => useContext(PlanetPositionsContext);
