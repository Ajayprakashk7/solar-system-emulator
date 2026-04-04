// SpeedControlContext.tsx
'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface SpeedControlContextType {
  speedFactor: number;
  setSpeedFactor: (value: number) => void;
  overrideSpeedFactor: () => void;
  restoreSpeedFactor: () => void;
}

const SpeedControlContext = createContext<SpeedControlContextType | undefined>(undefined);

export const useSpeedControl = () => {
  const context = useContext(SpeedControlContext);
  if (!context) {
    throw new Error('useSpeedControl must be used within a SpeedControlProvider');
  }
  return context;
};

export const SpeedControlProvider = ({ children }: { children: ReactNode }) => {
  const [speedFactor, setSpeedFactorState] = useState<number>(1);
  const [lastSpeedFactor, setLastSpeedFactor] = useState<number>(1);

  const setSpeedFactor = (value: number) => {
    setLastSpeedFactor(speedFactor);
    setSpeedFactorState(value);
  };

  const overrideSpeedFactor = () => {
    setLastSpeedFactor(speedFactor);
    setSpeedFactorState(0);
  };

  const restoreSpeedFactor = () => {
    setSpeedFactorState(lastSpeedFactor);
  };

  return (
    <SpeedControlContext.Provider value={{ speedFactor, setSpeedFactor, overrideSpeedFactor, restoreSpeedFactor }}>
      {children}
    </SpeedControlContext.Provider>
  );
};
