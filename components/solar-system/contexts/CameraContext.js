// CameraContext.js
'use client';
import React, { createContext, useContext, useState, useMemo } from 'react';

const CameraContext = createContext(null);

export const CameraProvider = ({ children }) => {
  const [cameraState, setCameraState] = useState('INTRO_ANIMATION');

  const contextValue = useMemo(() => ({ cameraState, setCameraState }), [cameraState]);

  return (
    <CameraContext.Provider value={contextValue}>
      {children}
    </CameraContext.Provider>
  );
};

export const useCameraContext = () => {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCameraContext must be used within a CameraProvider');
  }
  return context;
};
