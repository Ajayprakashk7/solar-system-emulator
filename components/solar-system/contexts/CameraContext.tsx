// CameraContext.tsx
'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CameraState, CameraContextType } from '../types';

const CameraContext = createContext<CameraContextType | null>(null);

export const CameraProvider = ({ children }: { children: ReactNode }) => {
  const [cameraState, setCameraState] = useState<CameraState>('INTRO_ANIMATION');

  return (
    <CameraContext.Provider value={{ cameraState, setCameraState }}>
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
