'use client';

import { useCallback, useEffect } from 'react';
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControl } from '../contexts/SpeedControlContext';
import planetsData from '../lib/planetsData';
import { SPEED_PRESETS } from './SpeedControl';

const KeyboardHandler = () => {
  const selectedPlanet = useSelectedPlanet();
  const { setSelectedPlanet } = useSelectedPlanetActions();
  const { cameraState, setCameraState } = useCameraContext();
  const { speedFactor, setSpeedFactor, overrideSpeedFactor, restoreSpeedFactor } =
    useSpeedControl();

  const selectPlanetByIndex = useCallback(
    (index) => {
      if (index < 0 || index >= planetsData.length) return;

      const planet = planetsData[index];
      setSelectedPlanet(planet);
      overrideSpeedFactor();
      setCameraState('ZOOMING_IN');
    },
    [overrideSpeedFactor, setCameraState, setSelectedPlanet]
  );

  const changeSpeed = useCallback(
    (direction) => {
      const currentIndex = SPEED_PRESETS.findIndex(
        (speed) => Math.abs(speedFactor - speed) < 0.1
      );
      const normalizedIndex = currentIndex >= 0 ? currentIndex : 2;
      const nextIndex = Math.min(
        SPEED_PRESETS.length - 1,
        Math.max(0, normalizedIndex + direction)
      );
      setSpeedFactor(SPEED_PRESETS[nextIndex]);
    },
    [setSpeedFactor, speedFactor]
  );

  const goHome = useCallback(() => {
    setCameraState('MOVING_TO_HOME');
    setSelectedPlanet(null);
    restoreSpeedFactor();
  }, [restoreSpeedFactor, setCameraState, setSelectedPlanet]);

  const handleKeyDown = useCallback(
    (event) => {
      // Modal surfaces (image gallery, first-run mobile help) own their keyboard
      // interactions. Global shortcuts must not change planets behind a modal.
      if (event.defaultPrevented || document.querySelector('[aria-modal="true"]')) {
        return;
      }

      const target = event.target;
      const isEditing =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT');

      if (isEditing) return;

      if (/^Digit[0-8]$/.test(event.code)) {
        event.preventDefault();
        selectPlanetByIndex(Number(event.code.replace('Digit', '')));
        return;
      }

      switch (event.code) {
        case 'Escape':
          if (cameraState !== 'FREE' || selectedPlanet) {
            event.preventDefault();
            goHome();
          }
          break;

        case 'KeyH':
        case 'Home':
          event.preventDefault();
          goHome();
          break;

        case 'Space':
          event.preventDefault();
          setSpeedFactor(speedFactor === 0 ? 1 : 0);
          break;

        case 'ArrowUp':
        case 'Equal':
          event.preventDefault();
          changeSpeed(1);
          break;

        case 'ArrowDown':
        case 'Minus':
          event.preventDefault();
          changeSpeed(-1);
          break;

        case 'KeyR':
          event.preventDefault();
          setSpeedFactor(1);
          break;

        case 'ArrowLeft': {
          event.preventDefault();
          const currentIndex = selectedPlanet
            ? planetsData.findIndex((planet) => planet.id === selectedPlanet.id)
            : 0;
          const previousIndex =
            currentIndex > 0 ? currentIndex - 1 : planetsData.length - 1;
          selectPlanetByIndex(previousIndex);
          break;
        }

        case 'ArrowRight': {
          event.preventDefault();
          const currentIndex = selectedPlanet
            ? planetsData.findIndex((planet) => planet.id === selectedPlanet.id)
            : -1;
          const nextIndex =
            currentIndex >= 0 && currentIndex < planetsData.length - 1
              ? currentIndex + 1
              : 0;
          selectPlanetByIndex(nextIndex);
          break;
        }

        default:
          break;
      }
    },
    [cameraState, changeSpeed, goHome, selectPlanetByIndex, selectedPlanet, setSpeedFactor, speedFactor]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return null;
};

export default KeyboardHandler;
