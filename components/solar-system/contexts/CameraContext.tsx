'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CameraContextType, CameraState } from '../types';

const CameraContext = createContext<CameraContextType | null>(null);

export const CameraProvider = ({ children }: { children: ReactNode }) => {
  const [cameraState, setCameraState] = useState<CameraState>('INTRO_ANIMATION');
  const [isTouring, setIsTouring] = useState<boolean>(false);

  return (
    <CameraContext.Provider value={{ cameraState, setCameraState, isTouring, setIsTouring }}>
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
