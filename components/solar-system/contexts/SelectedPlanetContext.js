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

  // Split context into state and actions. By pulling the actions out
  // into a separate context, we can ensure that components that only
  // need the stable O(1) actions don't rerender whenever the state changes.
  const value = useMemo(() => selectedPlanet, [selectedPlanet]);
  const actionsValue = useMemo(() => ({ setSelectedPlanet }), []);

  return (
    <SelectedPlanetContext.Provider value={value}>
      <SelectedPlanetActionsContext.Provider value={actionsValue}>
        {children}
      </SelectedPlanetActionsContext.Provider>
    </SelectedPlanetContext.Provider>
  );
};
