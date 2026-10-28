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

// Optimization: Separate actions context to prevent O(N) re-renders in 3D components
// that only need to dispatch state updates but don't need to read the state.
export const useSelectedPlanetActions = () => {
  const context = useContext(SelectedPlanetActionsContext);
  if (context === undefined) {
    throw new Error('useSelectedPlanetActions must be used within a SelectedPlanetProvider');
  }
  return context;
};

export const SelectedPlanetProvider = ({ children }) => {
  const [selectedPlanet, setSelectedPlanet] = useState(null);

  const actions = useMemo(() => ({ setSelectedPlanet }), []);

  return (
    <SelectedPlanetActionsContext.Provider value={actions}>
      <SelectedPlanetContext.Provider value={selectedPlanet}>
        {children}
      </SelectedPlanetContext.Provider>
    </SelectedPlanetActionsContext.Provider>
  );
};
