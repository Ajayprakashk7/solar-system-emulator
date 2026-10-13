'use client';

import { SelectedPlanetProvider } from './contexts/SelectedPlanetContext';
import { SpeedControlProvider } from './contexts/SpeedControlContext';
import { PlanetPositionsProvider } from './contexts/PlanetPositionsContext';
import { CameraProvider } from './contexts/CameraContext';
import { SimulationClockProvider } from './contexts/SimulationClockContext';

export default function SolarSystemProviders({ children }) {
  return (
    <SelectedPlanetProvider>
      <SpeedControlProvider>
        <SimulationClockProvider>
          <PlanetPositionsProvider>
            <CameraProvider>{children}</CameraProvider>
          </PlanetPositionsProvider>
        </SimulationClockProvider>
      </SpeedControlProvider>
    </SelectedPlanetProvider>
  );
}
