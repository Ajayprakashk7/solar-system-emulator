'use client';
import { useEffect, useRef, useState } from 'react';
import { useCameraContext } from '../contexts/CameraContext';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import planetsData from '../lib/planetsData';
import { CelestialSelection } from '../types';

export default function TourManager() {
  const { isTouring, setIsTouring, cameraState, setCameraState } = useCameraContext();
  const [, setSelectedPlanet] = useSelectedPlanet() as [unknown, (p: CelestialSelection) => void];
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset when tour stops
  useEffect(() => {
    if (!isTouring) {
      setCurrentIndex(0);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [isTouring]);

  // Move to planet when index changes
  useEffect(() => {
    if (!isTouring) return;

    const planet = planetsData[currentIndex];
    if (planet) {
      setSelectedPlanet(planet as unknown as CelestialSelection);
      setCameraState('ZOOMING_IN');
    }
  }, [currentIndex, isTouring, setSelectedPlanet, setCameraState]);

  // Schedule next planet when arrived
  useEffect(() => {
    if (!isTouring) return;

    if (cameraState === 'DETAIL_VIEW') {
      timeoutRef.current = setTimeout(() => {
        setCurrentIndex(prev => {
          const next = prev + 1;
          if (next >= planetsData.length) {
            setIsTouring(false);
            return 0;
          }
          return next;
        });
      }, 5000);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [cameraState, isTouring, setIsTouring]);

  return null;
}
