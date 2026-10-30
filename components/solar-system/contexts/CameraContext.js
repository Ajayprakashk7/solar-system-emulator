// CameraContext.js
'use client';

import React, { createContext, useContext, useState } from 'react';

const CameraContext = createContext(undefined);
const CameraActionsContext = createContext(undefined);

export const CameraProvider = ({ children }) => {
  const [cameraState, setCameraState] = useState('INTRO_ANIMATION');

  return (
    <CameraActionsContext.Provider value={setCameraState}>
      <CameraContext.Provider value={cameraState}>
        {children}
      </CameraContext.Provider>
    </CameraActionsContext.Provider>
  );
};

export const useCameraActions = () => {
  const context = useContext(CameraActionsContext);
  if (context === undefined) {
    throw new Error('useCameraActions must be used within a CameraProvider');
  }
  return context;
};

export const useCameraContext = () => {
  const context = useContext(CameraContext);
  if (context === undefined) {
    throw new Error('useCameraContext must be used within a CameraProvider');
  }
  return context;
};
