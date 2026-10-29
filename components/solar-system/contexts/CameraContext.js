// CameraContext.js
'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

const CameraContext = createContext(null);
const CameraActionsContext = createContext(null);

export const CameraProvider = ({ children }) => {
  const [cameraState, setCameraState] = useState('INTRO_ANIMATION');
  const stateValue = useMemo(() => ({ cameraState }), [cameraState]);
  const actionsValue = useMemo(() => ({ setCameraState }), []);

  return (
    <CameraActionsContext.Provider value={actionsValue}>
      <CameraContext.Provider value={stateValue}>{children}</CameraContext.Provider>
    </CameraActionsContext.Provider>
  );
};

export const useCameraState = () => {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCameraState must be used within a CameraProvider');
  }
  return context;
};

export const useCameraActions = () => {
  const context = useContext(CameraActionsContext);
  if (!context) {
    throw new Error('useCameraActions must be used within a CameraProvider');
  }
  return context;
};
