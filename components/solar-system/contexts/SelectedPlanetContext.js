// SelectedPlanetContext.js - supports both planets and moons
'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

const SelectedPlanetContext = createContext(undefined);

export const useSelectedPlanet = () => {
  const context = useContext(SelectedPlanetContext);
  if (!context) {
    throw new Error('useSelectedPlanet must be used within a SelectedPlanetProvider');
  }
  return context;
};

export const SelectedPlanetProvider = ({ children }) => {
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const value = useMemo(
    () => [selectedPlanet, setSelectedPlanet],
    [selectedPlanet]
  );

  return (
    <SelectedPlanetContext.Provider value={value}>
      {children}
    </SelectedPlanetContext.Provider>
  );
};
