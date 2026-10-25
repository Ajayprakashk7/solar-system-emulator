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
  if (context === undefined) {
    throw new Error('useSelectedPlanetActions must be used within a SelectedPlanetProvider');
  }
  return context;
};

export const SelectedPlanetProvider = ({ children }) => {
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  // O(1) performance optimization: split state and stable actions to prevent unnecessary re-renders in heavy 3D components
  const actionsValue = useMemo(() => ({ setSelectedPlanet }), []);

  return (
    <SelectedPlanetActionsContext.Provider value={actionsValue}>
      <SelectedPlanetContext.Provider value={selectedPlanet}>
        {children}
      </SelectedPlanetContext.Provider>
    </SelectedPlanetActionsContext.Provider>
  );
};
