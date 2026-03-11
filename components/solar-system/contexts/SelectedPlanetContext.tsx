// SelectedPlanetContext.tsx - Extended to support both planets and moons
'use client';
import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import { CelestialSelection } from '../types';

type SelectedPlanetContextType = [CelestialSelection, Dispatch<SetStateAction<CelestialSelection>>];

const SelectedPlanetContext = createContext<SelectedPlanetContextType>([null, () => {}]);

export const useSelectedPlanet = () => {
  return useContext(SelectedPlanetContext);
};

export const SelectedPlanetProvider = ({ children }: { children: ReactNode }) => {
  // selectedPlanet can now be:
  // - A planet object: { id, name, ...planetData }
  // - A moon object: { id, name, parentPlanet, isMoon: true, ...moonData }
  const [selectedPlanet, setSelectedPlanet] = useState<CelestialSelection>(null);

  return (
    <SelectedPlanetContext.Provider value={[selectedPlanet, setSelectedPlanet]}>
      {children}
    </SelectedPlanetContext.Provider>
  );
};
