// SpeedControlContext.js
'use client';
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

const SpeedControlContext = createContext(undefined);

export const useSpeedControl = () => {
  const context = useContext(SpeedControlContext);
  if (!context) {
    throw new Error('useSpeedControl must be used within a SpeedControlProvider');
  }
  return context;
};

export const SpeedControlProvider = ({ children }) => {
  const [speedFactor, setSpeedFactorState] = useState(1);
  const [lastSpeedFactor, setLastSpeedFactor] = useState(1);

  const setSpeedFactor = useCallback((value) => {
    setLastSpeedFactor(speedFactor);
    setSpeedFactorState(value);
  }, [speedFactor]);

  const overrideSpeedFactor = useCallback(() => {
    setLastSpeedFactor(speedFactor);
    setSpeedFactorState(0);
  }, [speedFactor]);

  const restoreSpeedFactor = useCallback(() => {
    setSpeedFactorState(lastSpeedFactor);
  }, [lastSpeedFactor]);

  // Using empty deps is wrong here but we just ignore it in the next command for R3F, wait we can just add the deps
  const contextValue = useMemo(() => ({ speedFactor, setSpeedFactor, overrideSpeedFactor, restoreSpeedFactor }), [speedFactor, setSpeedFactor, overrideSpeedFactor, restoreSpeedFactor]);

  return (
    <SpeedControlContext.Provider value={contextValue}>
      {children}
    </SpeedControlContext.Provider>
  );
};
