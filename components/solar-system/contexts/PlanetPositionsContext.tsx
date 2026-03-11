//PlanetPositionsContext.tsx
'use client';
import React, { createContext, useContext, useRef, useCallback, ReactNode, MutableRefObject } from 'react';

export interface PlanetPositionsContextType {
  planetPositionsRef: MutableRefObject<Record<string, [number, number, number]>>;
  updatePlanetPosition: (name: string, position: [number, number, number]) => void;
}

export const PlanetPositionsContext = createContext<PlanetPositionsContextType>({
  planetPositionsRef: { current: {} },
  updatePlanetPosition: () => {},
});

export const PlanetPositionsProvider = ({ children }: { children: ReactNode }) => {
  const planetPositionsRef = useRef<Record<string, [number, number, number]>>({});

  // Direct mutation of ref to avoid re-renders
  const updatePlanetPosition = useCallback((name: string, position: [number, number, number]) => {
    planetPositionsRef.current[name] = position;
  }, []);

  return (
    <PlanetPositionsContext.Provider value={{ planetPositionsRef, updatePlanetPosition }}>
      {children}
    </PlanetPositionsContext.Provider>
  );
};

export const usePlanetPositions = () => useContext(PlanetPositionsContext);
