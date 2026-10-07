//PlanetPositionsContext.js
'use client';
import React, { createContext, useContext, useRef, useCallback, useMemo } from 'react';

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

  const contextValue = useMemo(() => ({ planetPositionsRef, updatePlanetPosition }), [updatePlanetPosition]);

  return (
    <PlanetPositionsContext.Provider value={contextValue}>
      {children}
    </PlanetPositionsContext.Provider>
  );
};

export const usePlanetPositions = () => useContext(PlanetPositionsContext);
