//PlanetPositionsContext.js
'use client';
import React, { createContext, useContext, useRef, useCallback } from 'react';

export const PlanetPositionsContext = createContext({
  planetPositionsRef: { current: {} },
  updatePlanetPosition: () => {},
});

// Pre-allocate arrays for all celestial bodies
const INITIAL_POSITIONS = {
  "Sun": [0, 0, 0],
  "Mercury": [0, 0, 0],
  "Venus": [0, 0, 0],
  "Earth": [0, 0, 0],
  "Mars": [0, 0, 0],
  "Jupiter": [0, 0, 0],
  "Saturn": [0, 0, 0],
  "Uranus": [0, 0, 0],
  "Neptune": [0, 0, 0]
};

export const PlanetPositionsProvider = ({ children }) => {
  const planetPositionsRef = useRef(INITIAL_POSITIONS);

  // Direct mutation of ref to avoid re-renders and array allocations
  const updatePlanetPosition = useCallback((name, position) => {
    const posArray = planetPositionsRef.current[name];
    if (posArray) {
      posArray[0] = position[0];
      posArray[1] = position[1];
      posArray[2] = position[2];
    } else {
      planetPositionsRef.current[name] = [position[0], position[1], position[2]];
    }
  }, []);

  return (
    <PlanetPositionsContext.Provider value={{ planetPositionsRef, updatePlanetPosition }}>
      {children}
    </PlanetPositionsContext.Provider>
  );
};

export const usePlanetPositions = () => useContext(PlanetPositionsContext);
