// SelectedPlanetContext.js - supports both planets and moons
'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

export const SelectedPlanetContext = createContext(undefined);
export const SelectedPlanetActionsContext = createContext(undefined);

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

  // Optimization: Split state and actions to prevent unnecessary re-renders in 3D components.
  // O(N) re-renders in children are avoided by extracting the stable setter to an O(1) context.
  const actions = useMemo(() => ({ setSelectedPlanet }), []);

  return (
    <SelectedPlanetActionsContext.Provider value={actions}>
      <SelectedPlanetContext.Provider value={selectedPlanet}>
        {children}
      </SelectedPlanetContext.Provider>
    </SelectedPlanetActionsContext.Provider>
  );
};
