// SelectedPlanetContext.js - supports both planets and moons
'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

const SelectedPlanetContext = createContext(undefined);
// Optimization: Split context to prevent unnecessary re-renders of heavy 3D components when only actions are needed.
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

  const actions = useMemo(
    () => ({ setSelectedPlanet }),
    []
  );

  return (
    <SelectedPlanetActionsContext.Provider value={actions}>
      <SelectedPlanetContext.Provider value={selectedPlanet}>
        {children}
      </SelectedPlanetContext.Provider>
    </SelectedPlanetActionsContext.Provider>
  );
};
