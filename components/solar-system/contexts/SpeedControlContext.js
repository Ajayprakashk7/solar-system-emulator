// SpeedControlContext.js
'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

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
  const speedFactorRef = useRef(1);
  const resumeSpeedRef = useRef(1);

  const setSpeedFactor = useCallback((value) => {
    const nextValue = Number(value);
    if (!Number.isFinite(nextValue) || nextValue < 0) return;

    if (nextValue > 0) resumeSpeedRef.current = nextValue;
    speedFactorRef.current = nextValue;
    setSpeedFactorState(nextValue);
  }, []);

  const overrideSpeedFactor = useCallback(() => {
    if (speedFactorRef.current > 0) {
      resumeSpeedRef.current = speedFactorRef.current;
    }
    speedFactorRef.current = 0;
    setSpeedFactorState(0);
  }, []);

  const restoreSpeedFactor = useCallback(() => {
    const restoredSpeed = resumeSpeedRef.current || 1;
    speedFactorRef.current = restoredSpeed;
    setSpeedFactorState(restoredSpeed);
  }, []);

  const value = useMemo(
    () => ({ speedFactor, setSpeedFactor, overrideSpeedFactor, restoreSpeedFactor }),
    [overrideSpeedFactor, restoreSpeedFactor, setSpeedFactor, speedFactor]
  );

  return (
    <SpeedControlContext.Provider value={value}>{children}</SpeedControlContext.Provider>
  );
};
