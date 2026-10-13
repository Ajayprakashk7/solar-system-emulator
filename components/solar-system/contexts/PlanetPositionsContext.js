// PlanetPositionsContext.js
'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';

export const PlanetPositionsContext = createContext({
  planetPositionsRef: { current: {} },
  updatePlanetPosition: () => {},
});

export const PlanetPositionsProvider = ({ children }) => {
  const planetPositionsRef = useRef({});

  const updatePlanetPosition = useCallback((name, position) => {
    planetPositionsRef.current[name] = position;
  }, []);

  const value = useMemo(
    () => ({ planetPositionsRef, updatePlanetPosition }),
    [updatePlanetPosition]
  );

  return (
    <PlanetPositionsContext.Provider value={value}>
      {children}
    </PlanetPositionsContext.Provider>
  );
};

export const usePlanetPositions = () => useContext(PlanetPositionsContext);
