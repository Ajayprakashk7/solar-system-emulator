'use client';

import { useEffect, useRef } from 'react';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControl } from '../contexts/SpeedControlContext';
import planetsData from '../lib/planetsData';

const planets = planetsData.filter(p => !p.isSun);
const planetIdToIndexMap = new Map(planets.map((p, index) => [p.id, index]));

const MobileGestureHandler = () => {
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { cameraState, setCameraState } = useCameraContext();
  const { overrideSpeedFactor, restoreSpeedFactor } = useSpeedControl();

  useEffect(() => {
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now()
        };
      }
    };

    const handleTouchEnd = (e) => {
      if (e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;
        const deltaTime = Date.now() - touchStartRef.current.time;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Detect tap vs swipe
        const isTap = distance < 10 && deltaTime < 300;
        const isSwipe = distance > 50 && deltaTime < 500;

        if (isTap) {
          // Handle tap gestures based on context
          if (cameraState === 'DETAIL_VIEW') {
            // Exit planet detail view on tap
            setCameraState('MOVING_TO_HOME');
            setSelectedPlanet(null);
            restoreSpeedFactor();
          }
        } else if (isSwipe) {
          // Handle swipe gestures for planet navigation
          if (cameraState === 'FREE' && Math.abs(deltaX) > Math.abs(deltaY)) {
            const currentIndex = selectedPlanet 
              ? planetIdToIndexMap.get(selectedPlanet.id) ?? -1
              : -1;

            if (deltaX > 0 && currentIndex > 0) {
              // Swipe right - previous planet
              const prevPlanet = planets[currentIndex - 1];
              setSelectedPlanet(prevPlanet);
              overrideSpeedFactor();
              setCameraState('ZOOMING_IN');
            } else if (deltaX < 0 && currentIndex !== -1 && currentIndex < planets.length - 1) {
              // Swipe left - next planet
              const nextPlanet = planets[currentIndex + 1];
              setSelectedPlanet(nextPlanet);
              overrideSpeedFactor();
              setCameraState('ZOOMING_IN');
            }
          }
        }
      }
    };

    // Only add listeners on touch devices
    if ('ontouchstart' in window) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });

      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [cameraState, selectedPlanet, setSelectedPlanet, setCameraState, overrideSpeedFactor, restoreSpeedFactor]);

  return null; // This component doesn't render anything
};

export default MobileGestureHandler;
