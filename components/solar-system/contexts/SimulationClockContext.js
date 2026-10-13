'use client';

import { createContext, useContext, useMemo, useRef, useState } from 'react';
import { dateToJulianDate } from '../lib/orbitalMechanics';

const SimulationClockContext = createContext(undefined);

export const useSimulationClock = () => {
  const context = useContext(SimulationClockContext);
  if (!context) {
    throw new Error('useSimulationClock must be used within a SimulationClockProvider');
  }
  return context;
};

export const SimulationClockProvider = ({ children }) => {
  const [initialJulianDate] = useState(() => dateToJulianDate(new Date()));
  const currentJulianDateRef = useRef(initialJulianDate);

  const value = useMemo(
    () => ({ initialJulianDate, currentJulianDateRef }),
    [initialJulianDate]
  );

  return (
    <SimulationClockContext.Provider value={value}>
      {children}
    </SimulationClockContext.Provider>
  );
};
