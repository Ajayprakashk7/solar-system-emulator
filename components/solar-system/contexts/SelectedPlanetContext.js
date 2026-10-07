// SelectedPlanetContext.js - Extended to support both planets and moons
'use client';
import React, { createContext, useContext, useState, useMemo } from 'react';

const SelectedPlanetContext = createContext([null, () => {}]);

export const useSelectedPlanet = () => {
  return useContext(SelectedPlanetContext);
};

export const SelectedPlanetProvider = ({ children }) => {
  // selectedPlanet can now be:
  // - A planet object: { id, name, ...planetData }
  // - A moon object: { id, name, parentPlanet, isMoon: true, ...moonData }
  const [selectedPlanet, setSelectedPlanet] = useState(null);

  const contextValue = useMemo(() => [selectedPlanet, setSelectedPlanet], [selectedPlanet]);

  return (
    <SelectedPlanetContext.Provider value={contextValue}>
      {children}
    </SelectedPlanetContext.Provider>
  );
};
