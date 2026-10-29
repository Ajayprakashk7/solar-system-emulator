// SelectedPlanetContext.js - supports both planets and moons
'use client';

import React, { createContext, useContext, useState } from 'react';

const SelectedPlanetStateContext = createContext(undefined);
const SelectedPlanetActionsContext = createContext(undefined);

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

  return (
    <SelectedPlanetActionsContext.Provider value={setSelectedPlanet}>
      <SelectedPlanetStateContext.Provider value={selectedPlanet}>
        {children}
      </SelectedPlanetStateContext.Provider>
    </SelectedPlanetActionsContext.Provider>
  );
};
