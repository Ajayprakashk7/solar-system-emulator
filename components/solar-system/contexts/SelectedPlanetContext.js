// SelectedPlanetContext.js - supports both planets and moons
'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

const SelectedPlanetStateContext = createContext(undefined);
const SelectedPlanetActionsContext = createContext(undefined);

// ⚡ BOLT: Separated state and actions contexts to prevent unnecessary 3D re-renders
export const useSelectedPlanet = () => {
  const context = useContext(SelectedPlanetStateContext);
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
  const actionsValue = useMemo(() => ({ setSelectedPlanet }), []);

  return (
    <SelectedPlanetStateContext.Provider value={selectedPlanet}>
      <SelectedPlanetActionsContext.Provider value={actionsValue}>
        {children}
      </SelectedPlanetActionsContext.Provider>
    </SelectedPlanetStateContext.Provider>
  );
};
