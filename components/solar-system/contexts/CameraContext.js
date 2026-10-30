// CameraContext.js
'use client';

import React, { createContext, useContext, useState } from 'react';

const CameraContext = createContext(undefined);
const CameraActionsContext = createContext(undefined);

export const CameraProvider = ({ children }) => {
  const [cameraState, setCameraState] = useState('INTRO_ANIMATION');

  return (
    <CameraContext.Provider value={cameraState}>
      <CameraActionsContext.Provider value={setCameraState}>
        {children}
      </CameraActionsContext.Provider>
    </CameraContext.Provider>
  );
};

export const useCameraContext = () => {
  const context = useContext(CameraContext);
  if (context === undefined) {
    throw new Error('useCameraContext must be used within a CameraProvider');
  }
  return context;
};

export const useCameraActionsContext = () => {
  const context = useContext(CameraActionsContext);
  if (context === undefined) {
    throw new Error('useCameraActionsContext must be used within a CameraProvider');
  }
  return context;
};
