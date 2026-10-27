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

// Performance optimization: Split SelectedPlanetContext into state and actions contexts.
// This prevents unnecessary re-renders in components (like Sun) that only need the setter,
// reducing React render cycle overhead in heavy 3D scenes (effectively an O(N) to O(1) re-render reduction for those components).
export const SelectedPlanetProvider = ({ children }) => {
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const actions = useMemo(() => ({ setSelectedPlanet }), []);

  return (
    <SelectedPlanetContext.Provider value={selectedPlanet}>
      <SelectedPlanetActionsContext.Provider value={actions}>
        {children}
      </SelectedPlanetActionsContext.Provider>
    </SelectedPlanetContext.Provider>
  );
};
