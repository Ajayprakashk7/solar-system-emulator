// SelectedPlanetContext.js - supports both planets and moons
'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

const SelectedPlanetContext = createContext(undefined);
const SelectedPlanetActionsContext = createContext(undefined);

export const useSelectedPlanet = () => {
  const context = useContext(SelectedPlanetContext);
  if (!context) {
    throw new Error('useSelectedPlanet must be used within a SelectedPlanetProvider');
  }
  return context;
};

// Consumers that only need to change the selection use this context
// to avoid re-rendering whenever the selected planet changes.
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

  const value = useMemo(
    () => [selectedPlanet, setSelectedPlanet],
    [selectedPlanet]
  );

  return (
    <SelectedPlanetActionsContext.Provider value={actions}>
      <SelectedPlanetContext.Provider value={value}>
        {children}
      </SelectedPlanetContext.Provider>
    </SelectedPlanetActionsContext.Provider>
  );
};
