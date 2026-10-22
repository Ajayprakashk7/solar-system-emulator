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

  // ⚡ Bolt Performance Optimization:
  // By splitting the rapidly updating state (`selectedPlanet`) from the stable setter function (`setSelectedPlanet`)
  // into two distinct React Contexts, we prevent unnecessary, expensive re-renders in heavy 3D components
  // that only need to dispatch actions but don't care about the state changes.
  const actionsValue = useMemo(() => ({ setSelectedPlanet }), []);

  return (
    <SelectedPlanetContext.Provider value={selectedPlanet}>
      <SelectedPlanetActionsContext.Provider value={actionsValue}>
        {children}
      </SelectedPlanetActionsContext.Provider>
    </SelectedPlanetContext.Provider>
  );
};
