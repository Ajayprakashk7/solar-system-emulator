// SelectedPlanetContext.js - supports both planets and moons
'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

const SelectedPlanetContext = createContext(undefined);
const SelectedPlanetActionsContext = createContext(undefined);

export const useSelectedPlanet = () => {
  const context = useContext(SelectedPlanetContext);
  if (context === undefined) {
    throw new Error('useSelectedPlanet must be used within a SelectedPlanetProvider');
  }
  return context;
};

export const useSelectedPlanetActions = () => {
  const context = useContext(SelectedPlanetActionsContext);
  if (!context) {
    throw new Error('useSelectedPlanetActions must be used within a SelectedPlanetProvider');
  }
  return context;
};

export const SelectedPlanetProvider = ({ children }) => {
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const value = selectedPlanet;

  const actions = useMemo(
    () => ({ setSelectedPlanet }),
    []
  );

  return (
    <SelectedPlanetContext.Provider value={value}>
      <SelectedPlanetActionsContext.Provider value={actions}>
        {children}
      </SelectedPlanetActionsContext.Provider>
    </SelectedPlanetContext.Provider>
  );
};
