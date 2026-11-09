// PlanetPositionsContext.js
'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';

export const PlanetPositionsContext = createContext({
  planetPositionsRef: { current: {} },
  updatePlanetPosition: () => {},
});

export const PlanetPositionsProvider = ({ children }) => {
  const planetPositionsRef = useRef({});

  // Optimization: Mutate array in place to reduce GC pressure
  const updatePlanetPosition = useCallback((name, x, y, z) => {
    let currentPos = planetPositionsRef.current[name];
    if (!currentPos) {
      currentPos = new Float32Array(3);
      planetPositionsRef.current[name] = currentPos;
    }
    currentPos[0] = x;
    currentPos[1] = y;
    currentPos[2] = z;
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
